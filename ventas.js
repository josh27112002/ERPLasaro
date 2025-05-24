import {
  getFirestore, collection, getDocs, doc, addDoc, updateDoc, setDoc, getDoc
} from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";
import { app } from "./firebase.js";

const db = getFirestore(app);
const auth = getAuth();
const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
let clienteSeleccionado = null;
let clientesCache = [];

const buscarClienteInput = document.getElementById("buscarCliente");
const sugerenciasClientes = document.getElementById("sugerenciasClientes");
const nombreContadoInput = document.getElementById("nombreContado");
const clienteNITInput = document.getElementById("clienteNIT");
const numCuotasSelect = document.getElementById("numCuotas");
const pagoMensualSpan = document.getElementById("pagoMensual");

const formatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'GTQ'
});

document.getElementById("formaPago").addEventListener("change", e => {
  const tipo = e.target.value;
  document.getElementById("cuotasWrapper").style.display = tipo === "cuotas" ? "block" : "none";
  document.getElementById("seccionBusquedaCliente").style.display = tipo !== "contado" ? "block" : "none";
  document.getElementById("seccionNombreContado").style.display = tipo === "contado" ? "block" : "none";
  pagoMensualSpan.textContent = "";
});

numCuotasSelect.addEventListener("change", () => {
  const cuotas = parseInt(numCuotasSelect.value);
  const total = carrito.reduce((acc, item) => acc + item.cantidad * item.precio, 0);
  const pagoMensual = cuotas && total ? (total / cuotas).toFixed(2) : "";
  pagoMensualSpan.textContent = pagoMensual ? `Pago mensual: Q${pagoMensual}` : "";
});

buscarClienteInput.addEventListener("input", () => {
  const texto = buscarClienteInput.value.trim().toLowerCase();
  const sinCoincidencias = document.getElementById("sinCoincidencias");
  const tbody = sugerenciasClientes.querySelector("tbody");
  tbody.innerHTML = "";

  if (texto.length < 1) {
    sugerenciasClientes.style.display = "none";
    sinCoincidencias.style.display = "none";
    return;
  }

  const coincidencias = clientesCache.filter(c => {
    const nombre = c.nombre.toLowerCase();
    const palabras = nombre.split(" ");
    return palabras.some(p => p.startsWith(texto));
  }).slice(0, 5);

  if (coincidencias.length === 0) {
    sugerenciasClientes.style.display = "none";
    sinCoincidencias.style.display = "block";
    clienteSeleccionado = null;
    return;
  }

  sinCoincidencias.style.display = "none";

  coincidencias.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.nombre}</td>
      <td>${c.nit}</td>
    `;
    tr.addEventListener("click", () => {
      buscarClienteInput.value = c.nombre;
      clienteNITInput.value = c.nit;
      clienteSeleccionado = { ref: doc(db, "personas", c.id), data: () => c };
      sugerenciasClientes.style.display = "none";
    });
    tbody.appendChild(tr);
  });

  sugerenciasClientes.style.display = "table";
});

document.addEventListener("click", (e) => {
  if (!sugerenciasClientes.contains(e.target) && e.target !== buscarClienteInput) {
    sugerenciasClientes.style.display = "none";
  }
});

document.getElementById("btnMostrarFormularioNuevoCliente")?.addEventListener("click", () => {
  document.getElementById("formularioNuevoCliente").style.display = "flex";
});

document.getElementById("btnGuardarNuevoCliente")?.addEventListener("click", async () => {
  const nombre = document.getElementById("nuevoClienteNombre").value.trim();
  const nit = document.getElementById("nuevoClienteNIT").value.trim();
  const credito = parseFloat(document.getElementById("nuevoClienteCredito").value) || 0;

  if (!nombre || !nit) return alert("Completa todos los campos obligatorios.");

  const ref = doc(collection(db, "personas"));
  const nuevoCliente = {
    nombre,
    nit,
    credito,
    deuda: { total: 0, tipo: "", cuotas: 0, pagado: 0 }
  };

  await setDoc(ref, nuevoCliente);
  clienteSeleccionado = { ref, data: () => nuevoCliente };
  clienteNITInput.value = nit;
  document.getElementById("formularioNuevoCliente").style.display = "none";
  alert("✅ Cliente registrado correctamente.");
  await cargarClientes();
});

document.getElementById("btnConfirmarVenta").addEventListener("click", async () => {
  if (carrito.length === 0) {
    mostrarMensaje("⚠️ El carrito está vacío.", "error");
    return;
  }

  const formaPago = document.getElementById("formaPago").value;
  const cuotas = parseInt(numCuotasSelect.value) || 0;
  const total = carrito.reduce((acc, item) => acc + item.cantidad * item.precio, 0);

  if ((formaPago !== "contado") && !clienteSeleccionado) {
    mostrarMensaje("❌ Selecciona un cliente válido.", "error");
    return;
  }

  if ((formaPago === "credito" || formaPago === "cuotas") && clienteSeleccionado) {
    const data = clienteSeleccionado.data();
    const deudaActual = data.deuda?.total || 0;
    const creditoMax = data.credito || 0;

    if (deudaActual + total > creditoMax) {
      mostrarMensaje(`❌ Crédito insuficiente. Disponible: Q${(creditoMax - deudaActual).toFixed(2)}`, "error");
      return;
    }

    await updateDoc(clienteSeleccionado.ref, {
      deuda: {
        total: deudaActual + total,
        tipo: formaPago,
        cuotas: formaPago === "cuotas" ? cuotas : 0,
        pagado: 0
      }
    });
  }

  for (const item of carrito) {
    await addDoc(collection(db, "ventas"), {
      producto: item.nombre,
      cantidad: item.cantidad,
      total: item.precio * item.cantidad,
      fecha: new Date()
    });
  }

  const facturaID = `FAC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now()}`;
  const clienteNombre = clienteSeleccionado ? clienteSeleccionado.data().nombre : nombreContadoInput.value.trim() || "C/F";
  const clienteNIT = clienteSeleccionado ? clienteSeleccionado.data().nit : clienteNITInput.value.trim() || "C/F";

  const productosFactura = carrito.map(item => ({
    producto: item.nombre,
    cantidad: item.cantidad,
    precioUnitario: item.precio,
    subtotal: item.precio * item.cantidad
  }));

  await addDoc(collection(db, "facturas"), {
    numero: facturaID,
    cliente: clienteNombre,
    nit: clienteNIT,
    total,
    formaPago,
    cuotas: formaPago === "cuotas" ? cuotas : 0,
    productos: productosFactura,
    fecha: new Date()
  });

  localStorage.removeItem("carrito");
  mostrarMensaje("✅ Venta registrada con éxito.", "success");
  document.querySelector("#tablaResumen tbody").innerHTML = "";
  document.getElementById("totalVenta").textContent = "Q0.00";
  mostrarFactura(clienteNombre, clienteNIT, productosFactura);
});

function mostrarFactura(nombre, nit, productos) {
  document.getElementById("facturaClienteNombre").textContent = nombre;
  document.getElementById("facturaClienteNIT").textContent = nit;
  document.getElementById("facturaFecha").textContent = new Date().toLocaleString();

  const tbody = document.getElementById("facturaBody");
  tbody.innerHTML = "";
  let total = 0;

  productos.forEach(item => {
    const subtotal = item.subtotal;
    total += subtotal;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.producto}</td>
      <td>${item.cantidad}</td>
      <td>${formatter.format(item.precioUnitario)}</td>
      <td>${formatter.format(subtotal)}</td>`;
    tbody.appendChild(row);
  });

  document.getElementById("facturaTotal").textContent = formatter.format(total);
  document.getElementById("factura").style.display = "block";
}

function mostrarMensaje(msg, tipo) {
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = msg;
  mensaje.className = `mensaje ${tipo}`;
}

function renderizarTabla() {
  const tbody = document.querySelector("#tablaResumen tbody");
  tbody.innerHTML = "";
  let total = 0;
  carrito.forEach(item => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>${formatter.format(item.precio)}</td>
      <td>${formatter.format(subtotal)}</td>`;
    tbody.appendChild(row);
  });
  document.getElementById("totalVenta").textContent = formatter.format(total);
}

function cerrarSesion() {
  localStorage.clear();
  auth.signOut().then(() => window.location.href = "index.html");
}

async function cargarClientes() {
  const snap = await getDocs(collection(db, "personas"));
  clientesCache = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function cargarDatosEmpresa() {
  try {
    const ref = doc(db, "configuracion_factura", "empresa");
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      document.getElementById("empresaNombre").textContent = data.nombre || "Mi Empresa";
      document.getElementById("empresaNIT").textContent = "NIT: " + (data.nit || "-");
      document.getElementById("empresaDireccion").textContent = data.direccion || "Dirección";
      document.getElementById("empresaTelefono").textContent = data.telefono || "-";
    }
  } catch (err) {
    console.error("❌ Error al cargar datos de empresa:", err);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) return window.location.href = "index.html";
  const ref = doc(db, "usuarios", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return window.location.href = "index.html";
  const data = snap.data();

  document.getElementById("usuario-logueado").textContent = `Bienvenido, ${data.nombre}`;
  document.getElementById("rol-logueado").textContent = `Rol: ${data.rol}`;
  document.getElementById("fecha-hoy").textContent = new Date().toLocaleDateString('es-ES');

  await cargarClientes();
  await cargarDatosEmpresa();
  renderizarTabla();
});

window.ventas = {
  cerrarSesion
};
