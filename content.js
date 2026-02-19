// --- Observer Configuration ---
const obconfig = { attributes: false, childList: true, subtree: true };
const observer = new MutationObserver(check);
observer.observe(document.body, obconfig);

// --- Regex Setup ---
const bannedContext = ["word1", "word2", "word3"];
const scanner = regex(bannedContext);

// Core function to scan and filter comments

function check() {
  const commentsSection = document.querySelector("#comments #contents");
  if (!commentsSection) return;

  const comments = commentsSection.querySelectorAll(
    "ytd-comment-thread-renderer",
  );

  comments.forEach((comment) => {
    // Skip if already scanned
    if (comment.dataset.scanned) return;

    const isPinned = comment.querySelector("#pinned-comment-badge");
    const commentText = comment.querySelector("#content-text span");

    // Skip pinned comments
    if (isPinned) {
      comment.dataset.scanned = "true";
      return;
    }

    // Apply regex test and remove if matched
    if (commentText && scanner.test(commentText.textContent)) {
      comment.remove();
    } else {
      comment.dataset.scanned = "true";
    }
  });
}

// Regex Generator - Created by AI
// converts a word list into a smart Arabic-sensitive Regex
function regex(bannedWords) {
  return new RegExp(
    bannedWords
      .map((word) => {
        return word
          .replace(/[أإآا]/g, "[أإآا]") // Normalize Alif with all types of Hamza
          .split("") // Break word into individual characters
          .join("[\\u064B-\\u065F\\s]*"); // Allow Arabic diacritics and spaces between chars
      })
      .join("|"), // Combine words with OR operator
    "i", // Case-insensitive flag
  );
}
