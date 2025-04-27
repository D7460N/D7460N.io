// ============================
// D7460N - data.js
// GitHub JSON CRUD and Dataset Management
// ============================

// ---- Constants ----
const GITHUB_USER = 'your-github-username'; 
const GITHUB_REPO = 'd7460n-data'; 
const GITHUB_BRANCH = 'main'; // or 'master'
const GITHUB_TOKEN = 'ghp_xxxxxxxx'; // Your personal access token

// ---- Fetch the datasets.json (list of all datasets) ----
async function fetchDatasets() {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/datasets.json`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`
    }
  });

  const file = await response.json();
  const datasets = JSON.parse(atob(file.content));
  return datasets;
}

// ---- Fetch a specific dataset file (like DHCP/options.json) ----
async function fetchDataset(filePath) {
  const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filePath}`, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`
    }
  });

  const file = await response.json();
  const json = JSON.parse(atob(file.content));
  return { json, sha: file.sha };
}

// ---- Save an updated dataset back to GitHub ----
async function saveDataset(filePath, updatedJson, currentSha) {
  const base64Content = btoa(JSON.stringify(updatedJson, null, 2));

  const response = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `Bearer ${GITHUB_TOKEN}`
    },
    body: JSON.stringify({
      message: "Update dataset via D7460N SPA",
      content: base64Content,
      sha: currentSha,
      branch: GITHUB_BRANCH
    })
  });

  return response.ok;
}

// ---- Populate the <ul> with the dataset items ----
function populateList(data) {
  const list = document.querySelector('ul');
  list.innerHTML = '';

  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.code}: ${item.name}`;
    list.appendChild(li);
  });
}

// ---- Optional: Populate dataset selector if <select id="dataset-selector"> exists ----
async function populateDatasetSelector() {
  const datasets = await fetchDatasets();
  const select = document.getElementById('dataset-selector');

  if (!select) return; // If no selector in HTML, skip.

  datasets.forEach(dataset => {
    const option = document.createElement('option');
    option.value = dataset.path;
    option.textContent = dataset.label;
    select.appendChild(option);
  });

  select.addEventListener('change', async (e) => {
    const { json } = await fetchDataset(e.target.value);
    populateList(json);
  });
}

// ---- Initial Load on Page Ready ----
(async function init() {
  try {
    const datasets = await fetchDatasets();
    const defaultDataset = datasets.find(d => d.name === 'DHCP');

    if (defaultDataset) {
      const { json } = await fetchDataset(defaultDataset.path);
      populateList(json);
    }

    await populateDatasetSelector(); // Safe even if no <select> exists
  } catch (error) {
    console.error('Failed to initialize D7460N data fetch:', error);
  }
})();
