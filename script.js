let createWebringList = (sites) => {
  const webringList = document.getElementById("webring-list");
  sites.forEach((site) => {
    const displayUrl = site.website
      .replace(/^https?:\/\/(www\.)?/, "")
      .replace(/\/$/, "");

    const listItem = document.createElement("div");
    listItem.className = "grid grid-cols-6 gap-6";

    const name = document.createElement("span");
    name.className = "col-span-3 font-latinRomanCaps";
    name.textContent = site.name;

    const year = document.createElement("span");
    year.className = "text-right font-latinRoman";
    year.textContent = site.year;

    const link = document.createElement("a");
    link.href = site.website;
    link.className =
      "col-span-2 font-latinMonoRegular text-mustard-500 underline";
    link.textContent = displayUrl;

    listItem.appendChild(name);
    listItem.appendChild(year);
    listItem.appendChild(link);
    webringList.appendChild(listItem);
  });
};

createWebringList(webringData.sites);
