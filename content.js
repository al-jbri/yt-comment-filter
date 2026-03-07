// Global State Variables
let commentsSection = null;
let scanner = null;

// Initialization
getBlockList();

// Event Listeners
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.bannedContext) {
    getBlockList();
    console.log("Storage listener executed successfully");
  }
});

document.addEventListener("yt-navigate-finish", () => {
  if (observer) observer.disconnect();
  commentsSection = null;
  getCommentSection();
  console.log("Navigation listener executed successfully");
});

// Core Filtering Function
function check(force = false) {
  if (!scanner || !commentsSection) return;

  const comments = commentsSection.querySelectorAll(
    "ytd-comment-thread-renderer",
  );

  comments.forEach((comment) => {
    if (comment.dataset.scanned && !force) return;
    comment.dataset.scanned = true;

    const isPinned = comment.querySelector(
      "#pinned-comment-badge ytd-pinned-comment-badge-renderer",
    );
    const commentText = comment.querySelector("#content-text span");
    const commentUser = comment.querySelector("#author-text span");

    if (isPinned) {
      return;
    }

    if (commentText && scanner.test(commentText.textContent)) {
      comment.style.display = "none";
      updateLog(commentText.textContent, commentUser.textContent);
    } else {
      comment.style.display = "";
    }
  });

  console.log("Check function executed successfully");
}

// Data Fetching and Scanner Update
function getBlockList() {
  chrome.storage.local.get(["bannedContext"], (result) => {
    const list = result.bannedContext || [];

    if (list.length === 0) {
      scanner = null;
    } else {
      scanner = regex(list);
      check(true);
    }

    console.log("Block list fetched successfully");
  });
}

// MutationObserver Configuration
const obconfig = { attributes: false, childList: true, subtree: true };
const observer = new MutationObserver(() => {
  check(false);
});

// Observer Initialization
function startObserver() {
  observer.observe(commentsSection, obconfig);
  console.log("Observer started successfully");
}

// DOM Element Fetching
function getCommentSection() {
  if (!location.pathname.includes("/watch")) return;

  let maxAttempts = 20;

  const getCommentsSection = setInterval(() => {
    maxAttempts--;
    commentsSection = document.querySelector("ytd-comments #contents");

    if (commentsSection) {
      clearInterval(getCommentsSection);
      startObserver();
      console.log("Comment section found successfully");
    } else if (maxAttempts <= 0) {
      clearInterval(getCommentsSection);
    }
  }, 500);
}

// save the comment object to the log in local
function updateLog(text, user) {
  chrome.storage.local.get(["commentsLog"], (result) => {
    let list = result.commentsLog || [];

    list.unshift({ commentText: text, commentUser: user });

    // Enforce maximum limit of 30 items
    if (list.length > 30) {
      list.shift();
    }

    chrome.storage.local.set({ commentsLog: list });
    console.log("Log updated successfully");
  });
}

// Regex Generetor | bulit with AI
function regex(bannedItems) {
  return new RegExp(
    bannedItems
      .map((item) => {
        return item
          .split(" ")
          .map((word) => {
            return word
              .split("")
              .map((char) => {
                if (/[أإآا]/.test(char)) return "[أإآا]";
                if (/[.*+?^${}()|[\]\\]/.test(char)) return "\\" + char;
                return char;
              })
              .join("[\\u064B-\\u065F]*");
          })
          .join("\\s+");
      })
      .join("|"),
    "i",
  );
}
