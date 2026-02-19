const obconfig = { attributes: false, childList: true, subtree: true };
const observer = new MutationObserver(check);
observer.observe(document.body, obconfig);

const bannedContext = ["word1", "word2", "word3"];
const scanner = regex(bannedContext);

function check() {
  const commentsSection = document.querySelector("#comments #contents");
  if (!commentsSection) return;

  const comments = commentsSection.querySelectorAll(
    "ytd-comment-thread-renderer",
  );

  comments.forEach((comment) => {
    if (comment.dataset.scanned) return;

    const isPinned = comment.querySelector("#pinned-comment-badge");
    const commentText = comment.querySelector("#content-text span");

    if (isPinned) {
      comment.dataset.scanned = "true";
      return;
    }

    if (scanner.test(commentText.textContent)) {
      comment.remove();
    } else {
      comment.dataset.scanned = true;
    }
  });
}

function regex(bannedWords) {
  return new RegExp(
    bannedWords
      .map((word) => {
        return word
          .replace(/[أإآا]/g, "[أإآا]")
          .split("")
          .join("[\\u064B-\\u065F]*");
      })
      .join("|"),
    "gi",
  );
}
