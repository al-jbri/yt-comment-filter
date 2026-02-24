// Global State
let commentsSection = null;
let bannedContext = [];
let scanner = null;

// Initial Data Fetch
getBlockList();

// add some listeners
chrome.storage.sync.onChanged.addListener(getBlockList);
document.addEventListener("yt-navigate-finish", startObserver);

// Core function to scan and filter comments
function check() {
  if (!scanner) return;

  const comments = commentsSection.querySelectorAll(
    "ytd-comment-thread-renderer",
  );

  comments.forEach((comment) => {
    if (comment.dataset.scanned) return;
    comment.dataset.scanned = "true";

    const isPinned = comment.querySelector(
      "#pinned-comment-badge ytd-pinned-comment-badge-renderer",
    );
    const commentText = comment.querySelector("#content-text span");

    if (isPinned) {
      return;
    }

    if (commentText && scanner.test(commentText.textContent)) {
      comment.style.display = "none";
    }
  });
}

// Observer configuration
const obconfig = { attributes: false, childList: true, subtree: true };
const observer = new MutationObserver(check);

// Setup and start the MutationObserver
function startObserver() {
  observer.disconnect();

  if (!location.pathname.includes("/watch")) return;

  const getCommentsSection = setInterval(() => {
    commentsSection = document.querySelector("ytd-comments #contents");
    if (commentsSection) {
      clearInterval(getCommentsSection);
      observer.observe(commentsSection, obconfig);
    }
  }, 500);
}

// Fetch blocklist from storage and update the scanner
function getBlockList() {
  chrome.storage.sync.get(["bannedContext"], (result) => {
    bannedContext = result.bannedContext || [];

    if (bannedContext.length === 0) {
      scanner = null;
    } else {
      scanner = regex(bannedContext);
    }
  });
}

// Regex Generator - Created by AI
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
                return char;
              })
              .join("[\\u064B-\\u065F]*");
          })
          .join("\\s+");
      })
      .join("|"),
    "gi",
  );
}
