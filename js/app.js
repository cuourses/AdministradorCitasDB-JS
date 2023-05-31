
const mascotaInput = document.querySelector('#mascota');
const propietarioInput = document.querySelector('#propietario');
const telefonoInput = document.querySelector('#telefono');
const fechaInput = document.querySelector('#fecha');
const horaInput = document.querySelector('#hora');
const sintomasInput = document.querySelector('#sintomas');

// Contenedor para las citas
const contenedorCitas = document.querySelector('#citas');

// Formulario nuevas citas
const formulario = document.querySelector('#nueva-cita')
formulario.addEventListener('submit', nuevaCita);

// Heading
const heading = document.querySelector('#administra');


let editando = false;
let BD;


// Eventos
document.addEventListener('DOMContentLoaded', () => {
	eventListeners();
	crearBaseDatos();
});

function eventListeners() {
	mascotaInput.addEventListener('change', datosCita);
	propietarioInput.addEventListener('change', datosCita);
	telefonoInput.addEventListener('change', datosCita);
	fechaInput.addEventListener('change', datosCita);
	horaInput.addEventListener('change', datosCita);
	sintomasInput.addEventListener('change', datosCita);
}

const citaObj = {
	mascota: '',
	propietario: '',
	telefono: '',
	fecha: '',
	hora: '',
	sintomas: ''
}


function datosCita(e) {
	//  console.log(e.target.name) // Obtener el Input
	citaObj[e.target.name] = e.target.value;
}

// CLasses
class Citas {
	constructor() {
		this.citas = []
	}
	agregarCita(cita) {
		this.citas = [...this.citas, cita];
	}

	editarCita(citaActualizada) {
		this.citas = this.citas.map(cita => cita.id === citaActualizada.id ? citaActualizada : cita)
	}

	eliminarCita(id) {
		this.citas = this.citas.filter(cita => cita.id !== id);
	}
}

class UI {

	constructor() {
	}

	imprimirAlerta(mensaje, tipo) {
		// Crea el div
		const divMensaje = document.createElement('div');
		divMensaje.classList.add('text-center', 'alert', 'd-block', 'col-12');

		// Si es de tipo error agrega una clase
		if (tipo === 'error') {
			divMensaje.classList.add('alert-danger');
		} else {
			divMensaje.classList.add('alert-success');
		}

		// Mensaje de error
		divMensaje.textContent = mensaje;

		// Insertar en el DOM
		document.querySelector('#contenido').insertBefore(divMensaje, document.querySelector('.agregar-cita'));

		// Quitar el alert despues de 3 segundos
		setTimeout(() => {
			divMensaje.remove();
		}, 3000);
	}

	imprimirCitas() {

		this.limpiarHTML();

		leerCitasIndexDB();
	}


	limpiarHTML() {
		while (contenedorCitas.firstChild) {
			contenedorCitas.removeChild(contenedorCitas.firstChild);
		}
	}
}


const administrarCitas = new Citas();
const ui = new UI(administrarCitas);

function nuevaCita(e) {
	e.preventDefault();

	const { mascota, propietario, telefono, fecha, hora, sintomas } = citaObj;

	// Validar
	if (mascota === '' || propietario === '' || telefono === '' || fecha === '' || hora === '' || sintomas === '') {
		ui.imprimirAlerta('Todos los mensajes son Obligatorios', 'error')

		return;
	}

	if (editando) {
		// Estamos editando
		administrarCitas.editarCita({ ...citaObj });

		// Editamos la cita en indexDB
		editarCitaDB({ ...citaObj });

	} else {
		// Nuevo Registrando

		// Generar un ID único
		citaObj.id = Date.now();

		// Añade la nueva cita
		administrarCitas.agregarCita({ ...citaObj });

		// Registramos la cita en INDEXDB
		registrarCitaDB({ ...citaObj });

	}


	// Imprimir el HTML de citas
	ui.imprimirCitas();

	// Reinicia el objeto para evitar futuros problemas de validación
	reiniciarObjeto();

	// Reiniciar Formulario
	formulario.reset();

}

function reiniciarObjeto() {
	// Reiniciar el objeto
	citaObj.mascota = '';
	citaObj.propietario = '';
	citaObj.telefono = '';
	citaObj.fecha = '';
	citaObj.hora = '';
	citaObj.sintomas = '';
}


function eliminarCita(id) {
	administrarCitas.eliminarCita(id);

	const transaction = BD.transaction(['citas'], 'readwrite');
	const objectStore = transaction.objectStore('citas');

	objectStore.delete(id);

	transaction.oncomplete = () => {
		ui.imprimirAlerta('Se elimino correctamente')
	};

	transaction.onerror = () => {
		ui.imprimirAlerta('Error al elimianr', 'error')
	};

	ui.imprimirCitas()
}

function cargarEdicion(cita) {

	const { mascota, propietario, telefono, fecha, hora, sintomas, id } = cita;

	// Reiniciar el objeto
	citaObj.mascota = mascota;
	citaObj.propietario = propietario;
	citaObj.telefono = telefono;
	citaObj.fecha = fecha
	citaObj.hora = hora;
	citaObj.sintomas = sintomas;
	citaObj.id = id;

	// Llenar los Inputs
	mascotaInput.value = mascota;
	propietarioInput.value = propietario;
	telefonoInput.value = telefono;
	fechaInput.value = fecha;
	horaInput.value = hora;
	sintomasInput.value = sintomas;

	formulario.querySelector('button[type="submit"]').textContent = 'Guardar Cambios';

	editando = true;

}

const crearBaseDatos = () => {
	// creamos la base de datos
	const baseDatos = window.indexedDB.open('citas', 1);

	baseDatos.onupgradeneeded = () => {
		BD = baseDatos.result;
		const objectStore = BD.createObjectStore('citas', {
			keyPath: 'id',
			autoIncrement: true
		});

		objectStore.createIndex('mascota', 'mascota', { unique: false });
		objectStore.createIndex('propietario', 'propietario', { unique: false });
		objectStore.createIndex('telefono', 'telefono', { unique: false });
		objectStore.createIndex('fecha', 'fecha', { unique: false });
		objectStore.createIndex('hora', 'hora', { unique: false });
		objectStore.createIndex('sintomas', 'sintomas', { unique: false });
		objectStore.createIndex('id', 'id', { unique: true });
	};


	baseDatos.onerror = () => {
		console.log('Error al crear la BD');
	};

	baseDatos.onsuccess = () => {
		console.log('BD creada correctamente');
		BD = baseDatos.result;
		ui.imprimirCitas();
	};
};



const registrarCitaDB = (cita) => {
	const transaction = BD.transaction(['citas'], 'readwrite');
	const objectStore = transaction.objectStore('citas');

	objectStore.add(cita);

	transaction.onerror = () => {
		console.log('Error al registrar la cita');
	};

	transaction.oncopmplete = () => {
		console.log('Cita registrada');

		// Mostrar mensaje de que todo esta bien...
		ui.imprimirAlerta('Se agregó correctamente')
	};
};


const leerCitasIndexDB = () => {
	const transaction = BD.transaction('citas');
	const objectStore = transaction.objectStore('citas');

	// Para obtener datos de IndexDB usamos objectStore.openCursor().onsuccess = (event){}
	objectStore.openCursor().onsuccess = (event) => {

		// obtenemos un registro de la bd
		const cursor = event.target.result;

		if (cursor) {
			const { mascota, propietario, telefono, fecha, hora, sintomas, id } = cursor.value;
			const divCita = document.createElement('div');

			divCita.classList.add('cita', 'p-3');
			divCita.dataset.id = id;

			// Scripting
			const mascotaText = document.createElement('h2');
			mascotaText.textContent = mascota;
			mascotaText.classList.add('card-title', 'font-weight-bolder');

			const propietarioText = document.createElement('p');
			propietarioText.innerHTML = `
      <span class="font-weight-bolder">Propietario:</span> ${propietario}`;

			const telefonoText = document.createElement('p');
			telefonoText.innerHTML = `
      <span class="font-weight-bolder">Telefono:</span> ${telefono}`;

			const fechaText = document.createElement('p');
			fechaText.innerHTML = `
      <span class="font-weight-bolder">Fecha:</span> ${fecha}`;

			const horaText = document.createElement('p');
			horaText.innerHTML = `
      <span class="font-weight-bolder">Hora:</span> ${hora}`;

			const sintomasText = document.createElement('p');
			sintomasText.innerHTML = `
      <span class="font-weight-bolder">Sintomas:</span> ${sintomas}`;

			// boton para eliminar cita
			const bntEliminar = document.createElement('button');
			bntEliminar.textContent = 'Eliminar';
			bntEliminar.classList.add('btn', 'btn-danger', 'mr-2');
			bntEliminar.onclick = () => {
				eliminarCita(id);
			}

			// Boton para editar un cita
			const bntEditar = document.createElement('button');
			bntEditar.textContent = 'Editar';
			bntEditar.classList.add('btn', 'btn-info');
			bntEditar.onclick = () => {
				cargarEdicion(cursor.value)
			}


			divCita.append(mascotaText, propietarioText, telefonoText, fechaText, horaText, sintomasText, bntEliminar, bntEditar);

			contenedorCitas.appendChild(divCita);

			// Ve l siguiente elemento
			cursor.continue();
		};
	}
};

const editarCitaDB = (cita) => {
	const transaction = BD.transaction(['citas'], 'readwrite');
	const objectStore = transaction.objectStore('citas');

	objectStore.put(cita);

	transaction.oncomplete = () => {
		ui.imprimirAlerta('Guardado Correctamente');

		formulario.querySelector('button[type="submit"]').textContent = 'Crear Cita';

		editando = false;
	};

	transaction.onerror = () => {
		ui.imprimirAlerta('Error al editar la cita', 'error')
	}
};