const supabaseUrl = "https://ibqkbjwbwyimbxosnwca.supabase.co";
const supabaseKey = "sb_publishable_UVA9jVKuy8PJD2HnV16-GQ_TPsA8N17";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

console.log("SUPABASE CONNECTÉ :", supabaseUrl);

document.addEventListener("DOMContentLoaded", () => {
  ajouterBoutonMission();
  chargerDashboard();
});

function ajouterBoutonMission() {
  const container = document.querySelector("header") || document.querySelector(".main") || document.body;

  const btn = document.createElement("button");
  btn.innerText = "+ Nouvelle mission";
  btn.className = "btn-mission";
  btn.onclick = ouvrirFormulaireMission;

  container.appendChild(btn);

  const style = document.createElement("style");
  style.innerHTML = `
    .btn-mission {
      background: linear-gradient(135deg,#0066ff,#00bfff);
      color: white;
      border: none;
      padding: 15px 22px;
      border-radius: 16px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 0 20px rgba(0,153,255,.7);
      margin: 15px;
    }

    .modal-bg {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .modal {
      width: 420px;
      max-width: 92%;
      background: #08192c;
      padding: 25px;
      border-radius: 25px;
      box-shadow: 0 0 40px rgba(0,153,255,.7);
      color: white;
    }

    .modal input,
    .modal select,
    .modal textarea {
      width: 100%;
      margin: 8px 0;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #00aaff;
      background: #020b18;
      color: white;
    }

    .modal button {
      margin-top: 10px;
      width: 100%;
      padding: 13px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: bold;
    }

    .save-btn {
      background: #00aaff;
      color: white;
    }

    .close-btn {
      background: #444;
      color: white;
    }
  `;
  document.head.appendChild(style);
}

function ouvrirFormulaireMission() {
  const modal = document.createElement("div");
  modal.className = "modal-bg";

  modal.innerHTML = `
    <div class="modal">
      <h2>Nouvelle mission</h2>

      <input id="clientNom" placeholder="Nom du client">
      <input id="clientTel" placeholder="Téléphone">
      <input id="clientAdresse" placeholder="Adresse">

      <select id="service">
        <option>Lavage extérieur</option>
        <option>Lavage intérieur</option>
        <option>Lavage complet</option>
        <option>Lavage premium</option>
        <option>Nettoyage canapé</option>
        <option>Nettoyage tapis</option>
        <option>Nettoyage terrasse</option>
        <option>Lavage poubelle</option>
      </select>

      <input id="ouvrierNom" placeholder="Nom de l'ouvrier">
      <input id="prix" type="number" placeholder="Prix en €">

      <select id="statut">
        <option>À faire</option>
        <option>En cours</option>
        <option>Terminé</option>
      </select>

      <textarea id="commentaire" placeholder="Commentaire"></textarea>

      <button class="save-btn" onclick="enregistrerMission()">Enregistrer</button>
      <button class="close-btn" onclick="fermerModal()">Fermer</button>
    </div>
  `;

  document.body.appendChild(modal);
}

function fermerModal() {
  const modal = document.querySelector(".modal-bg");
  if (modal) modal.remove();
}

async function enregistrerMission() {
  const clientNom = document.getElementById("clientNom").value.trim();
  const clientTel = document.getElementById("clientTel").value.trim();
  const clientAdresse = document.getElementById("clientAdresse").value.trim();
  const service = document.getElementById("service").value;
  const ouvrierNom = document.getElementById("ouvrierNom").value.trim();
  const prix = Number(document.getElementById("prix").value);
  const statut = document.getElementById("statut").value;
  const commentaire = document.getElementById("commentaire").value.trim();

  if (!clientNom || !ouvrierNom || !prix) {
    alert("Remplis au minimum : client, ouvrier et prix.");
    return;
  }

  const { data: clientData, error: clientError } = await supabaseClient
    .from("clients")
    .insert({
      nom: clientNom,
      telephone: clientTel,
      adresse: clientAdresse
    })
    .select()
    .single();

  if (clientError) {
    console.error(clientError);
    alert("Erreur client");
    return;
  }

  const { data: employeeData, error: employeeError } = await supabaseClient
    .from("employees")
    .insert({
      nom: ouvrierNom,
      role: "ouvrier"
    })
    .select()
    .single();

  if (employeeError) {
    console.error(employeeError);
    alert("Erreur ouvrier");
    return;
  }

  const { error: missionError } = await supabaseClient
    .from("missions")
    .insert({
      client_id: clientData.id,
      employee_id: employeeData.id,
      service: service,
      prix: prix,
      statut: statut,
      date_intervention: new Date().toISOString().split("T")[0],
      commentaire: commentaire
    });

  if (missionError) {
    console.error(missionError);
    alert("Erreur mission");
    return;
  }

  alert("Mission enregistrée avec succès !");
  fermerModal();
  chargerDashboard();
}

async function chargerDashboard() {
  const { data: missions, error } = await supabaseClient
    .from("missions")
    .select(`
      id,
      service,
      prix,
      statut,
      clients(nom),
      employees(nom)
    `)
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const total = missions.length;
  const enCours = missions.filter(m => m.statut === "En cours").length;
  const terminees = missions.filter(m => m.statut === "Terminé").length;
  const ca = missions.reduce((sum, m) => sum + Number(m.prix || 0), 0);

  document.querySelector(".card.blue h2").innerText = total;
  document.querySelector(".card.orange h2").innerText = enCours;
  document.querySelector(".card.green h2").innerText = terminees;
  document.querySelector(".card.purple h2").innerText = ca + " €";

  const clientsUniques = new Set(missions.map(m => m.clients?.nom).filter(Boolean));
  const employesUniques = new Set(missions.map(m => m.employees?.nom).filter(Boolean));

  const clientsTotal = document.getElementById("clientsTotal");
  const employesActifs = document.getElementById("employesActifs");
  const prestationsTotal = document.getElementById("prestationsTotal");

  if (clientsTotal) clientsTotal.innerText = clientsUniques.size;
  if (employesActifs) employesActifs.innerText = employesUniques.size;
  if (prestationsTotal) prestationsTotal.innerText = total;

  const tbody = document.querySelector("tbody");
  tbody.innerHTML = "";

  if (missions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5">Aucune mission enregistrée pour le moment.</td>
      </tr>
    `;
    return;
  }

  missions.forEach(mission => {
    let statusClass = "progress";

    if (mission.statut === "Terminé") {
      statusClass = "done";
    }

    tbody.innerHTML += `
      <tr>
        <td>${mission.clients?.nom || "Client"}</td>
        <td>${mission.service}</td>
        <td>${mission.employees?.nom || "Ouvrier"}</td>
        <td>${mission.prix} €</td>
        <td>
          <span class="status ${statusClass}">
            ${mission.statut}
          </span>
        </td>
      </tr>
    `;
  });
}