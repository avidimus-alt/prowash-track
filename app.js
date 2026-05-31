// =============================
// CONFIGURATION SUPABASE
// =============================
// Remplace ces deux valeurs avant de déployer.
const SUPABASE_URL = "https://lqbgwffzshwqhfmeixqo.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4eW--E5CSpJhtS2M-5DSgA_H6FC1mg9";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let currentUser = null;
let currentEmployee = null;

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) return showLogin();
  await startApp(data.session.user);
});

function bindEvents() {
  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("forgotBtn").addEventListener("click", resetPassword);
  document.getElementById("logoutBtn").addEventListener("click", logout);

  document.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      document.querySelectorAll(".menu-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      await openPage(btn.dataset.page);
    });
  });
}

function showLogin() {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
}

function showApp() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
}

async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const message = document.getElementById("loginMessage");
  message.textContent = "";
  message.className = "";

  if (!email || !password) {
    message.textContent = "Entre ton email et ton mot de passe.";
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    console.error(error);
    message.textContent = "Connexion refusée. Vérifie l'email et le mot de passe.";
    return;
  }
  await startApp(data.user);
}

async function resetPassword() {
  const email = document.getElementById("loginEmail").value.trim();
  const message = document.getElementById("loginMessage");
  message.className = "";

  if (!email) {
    message.textContent = "Entre ton email avant de demander un nouveau mot de passe.";
    return;
  }

  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
  if (error) {
    console.error(error);
    message.textContent = "Impossible d'envoyer l'email de récupération.";
    return;
  }

  message.className = "success";
  message.textContent = "Email de récupération envoyé.";
}

async function logout() {
  await supabaseClient.auth.signOut();
  currentUser = null;
  currentEmployee = null;
  showLogin();
}

async function startApp(user) {
  currentUser = user;
  currentEmployee = await getOrCreateEmployee(user);

  const displayName = currentEmployee?.nom || user.email;
  document.getElementById("userAvatar").textContent = displayName[0].toUpperCase();
  document.getElementById("userName").textContent = displayName;
  document.getElementById("userEmail").textContent = user.email;

  showApp();
  await openPage("dashboard");
}

async function getOrCreateEmployee(user) {
  const { data, error } = await supabaseClient
    .from("employes")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (error) {
    console.error(error);
    alert("Erreur employé.");
    return null;
  }

  if (data) return data;

  const { data: created, error: createError } = await supabaseClient
    .from("employes")
    .insert({ nom: user.email.split("@")[0], email: user.email, role: "employe", actif: true })
    .select()
    .single();

  if (createError) {
    console.error(createError);
    alert("Impossible de créer l'employé connecté.");
    return null;
  }

  return created;
}

async function openPage(page) {
  if (page === "dashboard") return renderDashboard();
  if (page === "missions") return renderMissions();
  if (page === "new-mission") return renderNewMission();
  if (page === "employees") return renderEmployees();
  if (page === "clients") return renderClients();
  if (page === "stats") return renderStats();
  if (page === "settings") return renderSettings();
}

function setContent(html) {
  document.getElementById("pageContent").innerHTML = html;
}

async function fetchMissions() {
  const { data, error } = await supabaseClient
    .from("missions")
    .select(`id, service, prix, statut, date_mission, commentaire, clients(nom,telephone,adresse), employes(nom,email)`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    alert("Erreur de chargement des missions.");
    return [];
  }
  return data || [];
}

async function renderDashboard() {
  const missions = await fetchMissions();
  const total = missions.length;
  const enCours = missions.filter(m => m.statut === "En cours").length;
  const terminees = missions.filter(m => m.statut === "Terminé").length;
  const ca = missions.reduce((sum, m) => sum + Number(m.prix || 0), 0);
  const clientsCount = new Set(missions.map(m => m.clients?.nom).filter(Boolean)).size;
  const employesCount = new Set(missions.map(m => m.employes?.email).filter(Boolean)).size;

  setContent(`
    <section class="cards">
      <div class="card blue"><h3>Interventions</h3><h2>${total}</h2><p>Total</p></div>
      <div class="card orange"><h3>En cours</h3><h2>${enCours}</h2><p>Actives</p></div>
      <div class="card green"><h3>Terminées</h3><h2>${terminees}</h2><p>Réalisées</p></div>
      <div class="card purple"><h3>CA</h3><h2>${ca} €</h2><p>Revenus</p></div>
    </section>
    <section class="grid-2">
      <div class="panel"><h2>Dernières missions</h2>${missionsTable(missions.slice(0, 6))}</div>
      <div class="panel"><h2>Résumé</h2><table><tr><td>Clients</td><td><strong>${clientsCount}</strong></td></tr><tr><td>Employés actifs</td><td><strong>${employesCount}</strong></td></tr><tr><td>Prestations</td><td><strong>${total}</strong></td></tr></table></div>
    </section>
  `);
}

async function renderMissions() {
  const missions = await fetchMissions();
  setContent(`<div class="panel"><h2>Missions</h2>${missionsTable(missions)}</div>`);
}

function missionsTable(missions) {
  if (!missions.length) return `<p style="color:#9eb8d1;margin-top:15px;">Aucune mission enregistrée.</p>`;
  return `<div class="table-wrap"><table><thead><tr><th>Client</th><th>Service</th><th>Employé</th><th>Prix</th><th>Statut</th></tr></thead><tbody>${missions.map(m => `<tr><td>${safe(m.clients?.nom || "Client")}</td><td>${safe(m.service || "")}</td><td>${safe(m.employes?.nom || m.employes?.email || "Employé")}</td><td>${Number(m.prix || 0)} €</td><td><span class="status ${statusClass(m.statut)}">${safe(m.statut || "")}</span></td></tr>`).join("")}</tbody></table></div>`;
}

function statusClass(statut) {
  if (statut === "Terminé") return "done";
  if (statut === "En cours") return "progress";
  return "todo";
}

function renderNewMission() {
  setContent(`<div class="panel"><h2>Nouvelle mission</h2><div class="form-grid"><input id="clientNom" placeholder="Nom du client" /><input id="clientTel" placeholder="Téléphone" /><input id="clientAdresse" placeholder="Adresse" /><select id="service"><option>Lavage extérieur</option><option>Lavage intérieur</option><option>Lavage complet</option><option>Lavage premium</option><option>Nettoyage canapé</option><option>Nettoyage tapis</option><option>Nettoyage terrasse</option><option>Lavage poubelle</option></select><input id="prix" type="number" min="0" placeholder="Prix en €" /><select id="statut"><option>À faire</option><option>En cours</option><option>Terminé</option></select><textarea id="commentaire" placeholder="Commentaire"></textarea><div class="form-actions"><button class="primary-btn" id="saveMissionBtn">Enregistrer</button><button class="secondary-btn" onclick="openPage('dashboard')">Annuler</button></div><small id="missionMessage"></small></div></div>`);
  document.getElementById("saveMissionBtn").addEventListener("click", saveMission);
}

async function saveMission() {
  const message = document.getElementById("missionMessage");
  const clientNom = document.getElementById("clientNom").value.trim();
  const clientTel = document.getElementById("clientTel").value.trim();
  const clientAdresse = document.getElementById("clientAdresse").value.trim();
  const service = document.getElementById("service").value;
  const prix = Number(document.getElementById("prix").value);
  const statut = document.getElementById("statut").value;
  const commentaire = document.getElementById("commentaire").value.trim();
  message.textContent = "";
  message.className = "";

  if (!clientNom || !prix) {
    message.className = "error";
    message.textContent = "Remplis au minimum le client et le prix.";
    return;
  }

  if (!currentEmployee?.id) {
    message.className = "error";
    message.textContent = "Employé connecté introuvable.";
    return;
  }

  const { data: clientData, error: clientError } = await supabaseClient
    .from("clients")
    .insert({ nom: clientNom, telephone: clientTel, adresse: clientAdresse })
    .select()
    .single();

  if (clientError) {
    console.error(clientError);
    message.className = "error";
    message.textContent = "Erreur client.";
    return;
  }

  const { error: missionError } = await supabaseClient
    .from("missions")
    .insert({ client_id: clientData.id, employe_id: currentEmployee.id, service, prix, statut, date_mission: new Date().toISOString().slice(0, 10), commentaire });

  if (missionError) {
    console.error(missionError);
    message.className = "error";
    message.textContent = "Erreur mission.";
    return;
  }

  await renderDashboard();
}

async function renderEmployees() {
  const { data, error } = await supabaseClient.from("employes").select("*").order("created_at", { ascending: false });
  if (error) return alert("Erreur employés."), console.error(error);
  setContent(`<div class="panel"><h2>Employés</h2>${simpleTable(data || [], ["nom", "email", "telephone", "role", "actif"])}</div>`);
}

async function renderClients() {
  const { data, error } = await supabaseClient.from("clients").select("*").order("created_at", { ascending: false });
  if (error) return alert("Erreur clients."), console.error(error);
  setContent(`<div class="panel"><h2>Clients</h2>${simpleTable(data || [], ["nom", "telephone", "adresse"])}</div>`);
}

async function renderStats() {
  const missions = await fetchMissions();
  const ca = missions.reduce((sum, m) => sum + Number(m.prix || 0), 0);
  setContent(`<div class="panel"><h2>Statistiques</h2><p>Total missions : <strong>${missions.length}</strong></p><p>Chiffre d'affaires : <strong>${ca} €</strong></p></div>`);
}

function renderSettings() {
  setContent(`<div class="panel"><h2>Paramètres</h2><p>Utilisateur connecté : <strong>${safe(currentUser?.email || "")}</strong></p><p>Rôle : <strong>${safe(currentEmployee?.role || "employe")}</strong></p></div>`);
}

function simpleTable(rows, keys) {
  if (!rows.length) return `<p style="color:#9eb8d1;margin-top:15px;">Aucune donnée.</p>`;
  return `<div class="table-wrap"><table><thead><tr>${keys.map(k => `<th>${k}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${keys.map(k => `<td>${safe(String(row[k] ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function safe(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}
