const supabaseUrl = "https://lqbgwffzshwqhfmeixqo.supabase.co";
const supabaseKey = "sb_publishable_4eW--E5CSpJhtS2M-5DSgA_H6FC1mg9";

const supabaseClient = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

console.log("SUPABASE CONNECTÉ :", supabaseUrl);


document.addEventListener("DOMContentLoaded", async () => {
  installerProtectionConnexion();

  const { data } = await supabaseClient.auth.getSession();

  if (!data.session) {
    afficherConnexion();
    return;
  }

  afficherApplication(data.session.user);
});

function installerProtectionConnexion() {
  const app = document.querySelector(".main");
  const sidebar = document.querySelector(".sidebar");

  if (app) app.style.display = "none";
  if (sidebar) sidebar.style.display = "none";
}

function afficherApplication(user) {
  const app = document.querySelector(".main");
  const sidebar = document.querySelector(".sidebar");

  if (app) app.style.display = "block";
  if (sidebar) sidebar.style.display = "block";

  const login = document.getElementById("loginScreen");
  if (login) login.remove();

  const userBox = document.querySelector(".user-box");
  if (userBox) {
    const email = user?.email || "Utilisateur";
    userBox.innerHTML = `
      <div class="avatar">${email.charAt(0).toUpperCase()}</div>
      <div>
        <strong>${email}</strong><br>
        <button class="logout-btn" onclick="deconnexion()">Déconnexion</button>
      </div>
    `;
  }

  ajouterBoutonMission();
  chargerDashboard();
  activerMenus();
}

function afficherConnexion() {
  const login = document.createElement("div");
  login.id = "loginScreen";
  login.className = "login-screen";

  login.innerHTML = `
    <div class="login-box">
      <img src="logo-prowash.jpeg" alt="PROWASH" class="login-logo">
      <h1>PROWASH <span>TRACK</span></h1>
      <p>Connexion réservée aux ouvriers autorisés</p>

      <input id="loginEmail" type="email" placeholder="Email">
      <input id="loginPassword" type="password" placeholder="Mot de passe">

      <button onclick="connexion()">Se connecter</button>
      <small id="loginErreur"></small>
    </div>
  `;

  document.body.appendChild(login);
}

async function connexion() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const erreur = document.getElementById("loginErreur");

  if (!email || !password) {
    erreur.innerText = "Entre ton email et ton mot de passe.";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    erreur.innerText = "Connexion refusée. Vérifie l'email et le mot de passe.";
    return;
  }

  afficherApplication(data.user);
}

async function deconnexion() {
  await supabaseClient.auth.signOut();
  location.reload();
}


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
  const prix = Number(document.getElementById("prix").value);
  const statut = document.getElementById("statut").value;
  const commentaire = document.getElementById("commentaire").value.trim();

  if (!clientNom || !service || !prix) {
    alert("Remplis au minimum : client, service et prix.");
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
function activerMenus() {
  const menus = document.querySelectorAll(".menu li");

  menus.forEach((item) => {
    item.addEventListener("click", () => {
      menus.forEach(li => li.classList.remove("active"));
      item.classList.add("active");

      const texte = item.innerText;

      if (texte.includes("Dashboard")) {
        location.reload();
      }

      if (texte.includes("Missions")) {
        afficherPage("Missions", "Liste des missions enregistrées.");
      }

      if (texte.includes("Nouvelle mission")) {
        ouvrirFormulaireMission();
      }

      if (texte.includes("Employés")) {
        afficherPage("Employés", "Gestion des employés Prowash.");
      }

      if (texte.includes("Clients")) {
        afficherPage("Clients", "Gestion des clients.");
      }

      if (texte.includes("Photos")) {
        afficherPage("Photos", "Photos avant / après des interventions.");
      }

      if (texte.includes("Statistiques")) {
        afficherPage("Statistiques", "Statistiques de l'activité.");
      }

      if (texte.includes("Paramètres")) {
        afficherPage("Paramètres", "Réglages de l'application.");
      }
    });
  });
}

function afficherPage(titre, texte) {
  const content = document.querySelector(".content");

  if (!content) return;

  content.innerHTML = `
    <div class="panel" style="grid-column:1 / -1;">
      <h2>${titre}</h2>
      <p style="color:#9eb8d1;margin-top:15px;">${texte}</p>
    </div>
  `;
}
