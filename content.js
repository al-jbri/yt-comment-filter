// Global State Variables
let commentsSection = null;
let bannedContext = [];
let scanner = null;

// Initialization
getBlockList();

// Event Listeners
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.bannedContext) {
    getBlockList();
  }
});

document.addEventListener("yt-navigate-finish", getCommentSection);

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
}

// Data Fetching and Scanner Update
function getBlockList() {
  chrome.storage.local.get(["bannedContext"], (result) => {
    bannedContext = result.bannedContext || [];

    if (bannedContext.length === 0) {
      scanner = null;
    } else {
      scanner = regex(bannedContext);
      check(true);
    }
  });
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
    } else if (maxAttempts <= 0) {
      clearInterval(getCommentsSection);
    }
  }, 500);
}

// MutationObserver Configuration
const obconfig = { attributes: false, childList: true, subtree: false };
const observer = new MutationObserver(() => {
  check(false);
});

// Observer Initialization
function startObserver() {
  observer.disconnect();
  if (!commentsSection) return;
  observer.observe(commentsSection, obconfig);
}
// save the comment object to the log in local
function updateLog(text, user) {
  chrome.storage.local.get([commentsLog], (result) => {
    let log = result.commentsLog || [];

    log.push({ commentText: text, commentUser: user, timestamp: Date.now() });

    // Enforce maximum limit of 30 items
    if (log.length > 30) {
      log.shift();
    }

    chrome.storage.local.set({ commentsLog: log });
  });
}

// Regular Expression Generator
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
