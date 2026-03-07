const tagsContainer = document.getElementById("words-list");
const commentLog = document.getElementById("comments-log");

const addForm = document.getElementById("add-to-blocklist");
const addFormText = document.getElementById("word-input");

getAndRenderTags();
getAndRenderLogs();

chrome.storage.local.onChanged.addListener((changes) => {
  if (changes.commentsLog) {
    getAndRenderLogs();
  }
});

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addToBlockList(addFormText.value);
  addFormText.value = "";
});

tagsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("delete")) {
    removeFromBlockList(e.target.closest(".tag"));
  }
});

function getAndRenderTags() {
  chrome.storage.local.get(["bannedContext"], (result) => {
    tagsContainer.innerHTML = "";
    let list = result.bannedContext;
    if (!list) return;

    list.forEach((context) => {
      renderTag(context);
    });
  });

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

function getAndRenderLogs() {
  chrome.storage.local.get(["commentsLog"], (result) => {
    commentLog.innerHTML = "";

    let list = result.commentsLog;
    if (!list) return;
    list.forEach((comment) => {
      renderComment(comment);
    });
  });

  function renderComment(commentData) {
    // { commentText: text, commentUser: user, id: Date.now() };
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

function addToBlockList(text) {
  chrome.storage.local.get(["bannedContext"], (result) => {
    let list = result.bannedContext || [];

    if (list.includes(text)) return;
    list.push(text);
    chrome.storage.local.set({ bannedContext: list }, () => getAndRenderTags());
  });
}

function removeFromBlockList(tag) {
  chrome.storage.local.get(["bannedContext"], (result) => {
    let list = result.bannedContext.filter((i) => {
      i !== tag.textContent;
    });

    chrome.storage.local.set({ bannedContext: list }, () => getAndRenderTags());
  });
}
