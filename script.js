let logConsoleMessage = () => {
  console.log(
    "%c👋 Hey there" +
      "\n\n%cLooks like you're poking around in the console. Why not add your site to the webring?" +
      "\n\n%c→ https://github.com/JusGu/uwatering",
    "font-size: 18px; font-weight: bold; color: #FF3366;",
    "font-size: 14px; color: #00FF00;",
    "font-size: 14px; color: #3399FF; text-decoration: underline;"
  );
};
let createWebringList = (sites) => {
  const webringList = document.getElementById("webring-list");
  webringList.innerHTML = "";
  sites.forEach((site) => {
    const displayUrl = site.website
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "");

    const listItem = document.createElement("div");
    listItem.className = "grid grid-cols-12 sm:grid-cols-6 gap-3 sm:gap-6";

    const name = document.createElement("span");
    name.className = "col-span-5 sm:col-span-3 font-latinRomanCaps truncate";
    name.textContent = site.name;

    const year = document.createElement("span");
    year.className = "col-span-2 sm:col-span-1 text-right font-latinRoman";
    year.textContent = site.year;

    const link = document.createElement("a");
    link.href = site.website;
    link.className =
      "col-span-5 sm:col-span-2 font-latinMonoRegular text-mustard-500 underline truncate";
    link.textContent = displayUrl;

    listItem.appendChild(name);
    listItem.appendChild(year);
    listItem.appendChild(link);
    webringList.appendChild(listItem);
  });
};
function handleUrlFragment(searchInput) {
  const fragment = window.location.hash.slice(1); // Remove the # symbol
  if (fragment) {
    searchInput.value = decodeURIComponent(fragment);
    filterWebring(fragment);
    const searchEvent = new Event("input");
    searchInput.dispatchEvent(searchEvent);
  }
}
function filterWebring(searchTerm) {
  const searchLower = searchTerm.toLowerCase();
  const filteredSites = webringData.sites.filter(
    (site) =>
      site.name.toLowerCase().includes(searchLower) ||
      site.website.toLowerCase().includes(searchLower) ||
      site.year.toString().includes(searchLower)
  );
  createWebringList(filteredSites);
}
let navigateWebring = () => {
  // https://cs.uwatering.com/#your-site-here?nav=next OR
  // https://cs.uwatering.com/#your-site-here?nav=prev
  const fragment = window.location.hash.slice(1); // #your-site-here?nav=
  if (!fragment.includes("?")) return;
  const [currentSite, query] = fragment.split("?");
  const params = new URLSearchParams(query);
  const nav = params.get("nav");
  if (!nav || !["next", "prev"].includes(nav)) return;

  const currIndex = webringData.sites.findIndex((site) =>
    site.website.includes(currentSite)
  );
  if (currIndex === -1) return;
  const increment = nav === "next" ? 1 : -1;
  let newIndex = (currIndex + increment) % webringData.sites.length;
  if (newIndex < 0) newIndex = webringData.length - 1;
  if (!webringData.sites[newIndex]) return;

  document.body.innerHTML = `
  <main class="p-6 min-h-[100vh] w-[100vw] text-black-900">
    <p class="font-latinMonoCondOblique">redirecting...</p>
  </main>
  `;
  window.location.href = webringData.sites[newIndex].website;
};

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.hash.includes("?nav=")) {
    navigateWebring();
  }
  const desktopInput = document.getElementById("search");
  const mobileInput = document.getElementById("search-mobile");

  logConsoleMessage();
  createWebringList(webringData.sites);
  handleUrlFragment(desktopInput);
  handleUrlFragment(mobileInput);

  desktopInput.addEventListener("input", (e) => {
    filterWebring(e.target.value);
  });
  mobileInput.addEventListener("input", (e) => {
    filterWebring(e.target.value);
  });
  window.addEventListener("hashChange", () => {
    handleUrlFragment(desktopInput);
    handleUrlFragment(mobileInput);
  });
  window.addEventListener("hashchange", navigateWebring());
});
