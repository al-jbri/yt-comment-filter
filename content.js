// Global State Variables
let commentsSection = null;
let scanner = null;

// Initialization
getBlockList();

// Event Listeners
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.bannedContext) getBlockList();
});

document.addEventListener("yt-navigate-finish", () => {
  if (observer) observer.disconnect();
  commentsSection = null;
  getCommentSection();
});

// Core Filtering Function
function check(force = false) {
  if (!commentsSection) return;

  const comments = commentsSection.querySelectorAll(
    "ytd-comment-thread-renderer",
  );

  let bannedComments = [];

  comments.forEach((comment) => {
    if (comment.dataset.scanned && !force) return;
    comment.dataset.scanned = true;

    const isPinned = comment.querySelector(
      "#pinned-comment-badge ytd-pinned-comment-badge-renderer",
    );

    if (isPinned) return;

    const commentText = getTextWIthEmoji(
      comment.querySelector("#content-text span"),
    );

    if (!scanner) {
      comment.style.display = "";
      return;
    }

    const commentUser = comment.querySelector("#author-text span");

    if (commentText && scanner.test(commentText)) {
      comment.style.display = "none";
      bannedComments.push({ text: commentText, user: commentUser.innerText });
    } else {
      comment.style.display = "";
    }
  });

  if (bannedComments.length > 0) {
    updateLog(bannedComments);
  }
}

// Data Fetching and Scanner Update
function getBlockList() {
  chrome.storage.local.get(["bannedContext"], (result) => {
    const list = result.bannedContext || [];

    scanner = list.length === 0 ? null : regex(list);
    check(true);
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
}

// DOM Element Fetching
function getCommentSection() {
  if (!location.pathname.includes("/watch")) return;

  let maxAttempts = 20;

  const getCommentsSection = setInterval(() => {
    maxAttempts--;
    commentsSection = document.querySelector("ytd-comments");

    if (commentsSection) {
      clearInterval(getCommentsSection);
      startObserver();
    } else if (maxAttempts <= 0) {
      clearInterval(getCommentsSection);
    }
  }, 500);
}

// save the comment object to the log in local
function updateLog(newComments) {
  chrome.storage.local.get(["commentsLog"], (result) => {
    let list = result.commentsLog || [];
    list = [...newComments, ...list];

    // Remove duplicate comments (matching user and text) to prevent log clutter
    let uniqueList = list.filter((comment, index) => {
      return (
        index ===
        list.findIndex((c) => {
          return c.text === comment.text && c.user === comment.user;
        })
      );
    });

    // Enforce maximum limit of 50 items
    uniqueList = uniqueList.slice(0, 50);

    chrome.storage.local.set({ commentsLog: uniqueList });
  });
}

function getTextWIthEmoji(rawComment) {
  let finalText = "";
  rawComment.childNodes.forEach((element) => {
    if (element.nodeType === 3) {
      finalText += elemnt.nodeValue;
    } else if (elemnt.nodeName === "SPAN") {
      let spanImg = elemnt.querySelector("img");
      if (spanImg) {
        finalText += spanImg.alt;
      }
    }
  });
  return finalText.trim();
}

// Regex Generetor | genereted by AI
function regex(bannedItems) {
  const regexPattern = bannedItems
    .map((item) => {
      return item
        .trim()
        .split(/\s+/)
        .map((word) => {
          return Array.from(word)
            .map((char) => {
              if (/[.*+?^${}()|[\]\\]/.test(char)) return "\\" + char;
              if (/[أإآا]/.test(char)) return "[أإآا][\\u0640\\u064B-\\u065F]*";
              if (/[\u0621-\u064A]/.test(char))
                return char + "[\\u0640\\u064B-\\u065F]*";
              return char;
            })
            .join("");
        })
        .join("\\s+");
    })
    .join("|");

  return new RegExp(regexPattern, "iu");
}
