const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.getUsuariosPrivado = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) {
    throw new functions.https.HttpsError("unauthenticated", "Debes iniciar sesión.");
  }

  const userDoc = await db.collection("usuarios").doc(uid).get();
  const userData = userDoc.data();

  if (!userData || userData.rol !== "Administrador") {
    throw new functions.https.HttpsError("permission-denied", "No tienes permisos para ver usuarios.");
  }

  const snapshot = await db.collection("usuarios").get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
});
