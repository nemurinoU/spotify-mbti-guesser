
const token = localStorage.getItem('access_token');
const answer = localStorage.getItem('answer');

async function fetchTopArtists() {
  try {
    const res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Statusx:", res.status);

    const data = await res.json();
    console.log("Datax:", data);

    return data.items;
  } catch (err) {
    console.error("Fetch error:", err);
  }
}


async function renderTopArtists() {
  const container = document.querySelector('#results');
  const artists = await fetchTopArtists();

  container.innerHTML = `
    <h3> Your result: </h3><br>
    <p class="mb-3" style="white-space: pre-wrap;">
    ${marked.parse(answer)}
    </p>
    <h3 class="mb-3">Your Top Artists</h3>
    <ul class="list-group">
      ${artists
        .map(
          artist => `
        <li class="list-group-item d-flex align-items-center">
          <img src="${artist.images[2]?.url}" class="rounded me-3" width="50" height="50">
          <strong>${artist.name}</strong>
        </li>
      `
        )
        .join('')}
    </ul>
  `;
}

renderTopArtists();
