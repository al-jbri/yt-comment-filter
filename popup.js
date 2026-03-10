// DOM elements for tags and comment log
const tagsContainer = document.getElementById("words-list");
const commentLog = document.getElementById("comments-log");

// Form elements
const addForm = document.getElementById("add-to-blocklist");
const addFormText = document.getElementById("word-input");

// Initial render
getAndRenderTags();
getAndRenderLogs();

// Listen for changes in storage and update logs
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.commentsLog) {
    getAndRenderLogs();
  }
});

// Handle new word submission
addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addToBlockList(addFormText.value);
  addFormText.value = "";
});

// Handle tag deletion
tagsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) {
    removeFromBlockList(
      e.target.closest(".tag").querySelector(".tag-text").textContent,
    );
  }
});

// Fetch banned words from storage and display them
function getAndRenderTags() {
  chrome.storage.local.get(["bannedContext"], (result) => {
    tagsContainer.innerHTML = "";
    let list = result.bannedContext;
    if (!list) return;

    list.forEach((context) => {
      renderTag(context);
    });
  });

  // Render a single tag
  function renderTag(tagText) {
    const tagHtml = `
      <span class="tag-text" dir="auto"></span>
      <span class="delete">X</span>
    `;

    let element = document.createElement("div");
    element.innerHTML = tagHtml;
    element.classList.add("tag");
    element.setAttribute("title", tagText);
    element.querySelector(".tag-text").textContent = tagText;

    tagsContainer.appendChild(element);
  }
}

// Fetch comment logs from storage and display them
function getAndRenderLogs() {
  chrome.storage.local.get(["commentsLog"], (result) => {
    commentLog.innerHTML = "";
    let list = result.commentsLog;
    if (!list) return;

    list.forEach((comment) => {
      renderComment(comment);
    });
  });

  // Render a single comment
  function renderComment(commentData) {
    const commentElement = document.createElement("div");
    commentElement.classList.add("comment");
    commentElement.dataset.id = commentData.id;
    commentElement.innerHTML = `
      <p class="user" dir="auto"></p>
      <p class="comment-text" dir="auto"></p>
    `;

    commentElement.querySelector(".user").textContent = commentData.commentUser;
    commentElement.querySelector(".comment-text").textContent =
      commentData.commentText;

    commentLog.appendChild(commentElement);
  }
}

// Add a word to banned list if not already present
function addToBlockList(text) {
  chrome.storage.local.get(["bannedContext"], (result) => {
    let list = result.bannedContext || [];

    if (list.includes(text)) return;
    list.push(text);
    chrome.storage.local.set({ bannedContext: list }, () => getAndRenderTags());
  });
}

// Remove a word from banned list
function removeFromBlockList(tagText) {
  chrome.storage.local.get(["bannedContext"], (result) => {
    let list = result.bannedContext.filter((i) => {
      return i !== tagText;
    });

    chrome.storage.local.set({ bannedContext: list }, () => getAndRenderTags());
  });
}
