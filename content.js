let commentsSection = null;
const bannedContext = ["word1", "word2", "word3"];
const scanner = regex(bannedContext);

// --- Observer Configuration ---
const obconfig = { attributes: false, childList: true, subtree: true };
const observer = new MutationObserver(check);

document.addEventListener("yt-navigate-finish", () => {
  observer.disconnect();
  if (!location.pathname.includes("/watch")) return;

  const getCommentsSection = setInterval(() => {
    commentsSection = document.querySelector("ytd-comments #contents");
    if (commentsSection) {
      clearInterval(getCommentsSection);
      observer.observe(commentsSection, obconfig);
    }
  }, 500);
});

// Core function to scan and filter comments
function check() {
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
