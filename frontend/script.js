// Backend must be running locally: uvicorn main:app --reload --port 8000
const API_URL = "http://localhost:8000";

document.getElementById("match-btn").addEventListener("click", async () => {
  const inputs = document.querySelectorAll(".trait-input");
  const traits = Array.from(inputs).map(i => i.value).filter(v => v.trim() !== "");

  if (traits.length < 3) {
    alert("Enter at least 3 traits.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ traits }),
    });

    if (!res.ok) throw new Error(`Server responded ${res.status}`);

    const data = await res.json();
    const top = data.ranking[0];

    const resultBox = document.getElementById("result");
    resultBox.classList.remove("hidden");
    document.getElementById("result-name").innerText = `You matched: ${top.name}`;
    document.getElementById("result-desc").innerText = top.description;
    document.getElementById("result-catchphrase").innerText = `"${top.catchphrase}"`;

    const breakdown = document.getElementById("result-breakdown");
    breakdown.innerHTML = "<strong>Full ranking:</strong>" +
      data.ranking.map(r =>
        `<div><span>${r.name}</span><span>${(r.score * 100).toFixed(0)}%</span></div>`
      ).join("");
  } catch (err) {
    alert("Couldn't reach the backend. Make sure the FastAPI server is running on localhost:8000.");
    console.error(err);
  }
});
