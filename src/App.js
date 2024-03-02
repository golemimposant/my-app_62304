// J'ai laissé l'import du css car il aurait servi si le projet avait continué.
// Pour le reste, il y a des import Bootstrap pour les design de boutons/form/fenêtre modale etc.
// font-awesome pour les icônes et tout simplement react pour les useState et useEffect.

import './App.css';
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan, faSearch, faPencil } from '@fortawesome/free-solid-svg-icons';


function App() {
	
  // définition des constantes avec des useState ==> 'https://react.dev/reference/react/useState'
	
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [currentPageUrl, setCurrentPageUrl] = useState('https://hapi.fhir.org/baseR5/Patient?_count=10');
  const [nextPageUrl, setNextPageUrl] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [patientToUpdate, setPatientToUpdate] = useState(null);

//La partie useEffect sert à l'organisation de l'exécution des fonctions ==> 'https://react.dev/reference/react/useEffect'

  useEffect(() => {
    fetch(currentPageUrl)
      .then(response => response.json())
      .then(data => {
        const fetchedPatients = data.entry?.map(entry => ({
          id: entry.resource.id,
          // L'acquisition de name demande une vérification des valeurs nulles et la fusion des différents éléments qui peuvent exister dans name.
		  name: `${entry.resource.name && entry.resource.name[0].given && entry.resource.name[0].given.length > 0 ? entry.resource.name[0].given.join(' ') : 'Unknown'} ${entry.resource.name && entry.resource.name[0].family ? entry.resource.name[0].family : 'Name'}`,
          gender: entry.resource.gender,
          birthDate: entry.resource.birthDate,
        })) || [];
        setPatients(fetchedPatients);
        // La fonction next est vraiment bizarre, mais elle permet la génération d'éléments qui suivent ceux-là dans la liste.
        const nextLink = data.link.find(link => link.relation === "next");
        setNextPageUrl(nextLink ? nextLink.url : '');
      })
	  
	  //gestion d'erreur de récupération
      .catch(error => console.error('Error fetching patients:', error));
  }, [currentPageUrl]);
	
	//constante pour le passage à la page suivante
  const handleNextPage = () => {
    setCurrentPageUrl(nextPageUrl);
  };

	// clic pour enclencher la récupération du contenu de la barre de recherche pour effectuer des filtres (uniquement sur le nom/prénom)
  const handleSearchClick = () => {
    const url = `https://hapi.fhir.org/baseR5/Patient?_count=10&name=${encodeURIComponent(searchTerm)}`;
    setCurrentPageUrl(url);
  };
  
	//gestion de la recherche
  const handleSearch = () => {
	const searchURL = `https://hapi.fhir.org/baseR5/Patient?_count=10&name=${encodeURIComponent(searchTerm)}`;
	fetch(searchURL)
	  .then(response => response.json())
	  .catch(error => console.error('Error fetching patients:', error));
  };
  
  //constantes spécifiques à l'action delete et à la fenêtre modale correspondante, ainsi que la constante de gestion du clic et celle de la confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientIdToDelete, setPatientIdToDelete] = useState(null);

  const handleDeleteClick = (patientId) => {
    setPatientIdToDelete(patientId);
    setShowDeleteModal(true);
  };  

  const handleConfirmDelete = () => {
	  fetch(`https://hapi.fhir.org/baseR5/Patient/${patientIdToDelete}?_cascade=delete`, {
		method: 'DELETE',
	  })
	  .then(response => {
		if (response.ok) {
		  console.log("Patient supprimé avec succès");
		  setPatients(patients.filter(patient => patient.id !== patientIdToDelete));
		} else {
		  console.error("Erreur lors de la suppression du patient");
		}
	  })
	  .catch(error => console.error('Erreur:', error))
	  .finally(() => setShowDeleteModal(false)); // Fermez la modale après la suppression
  };
  
  // gestion au clic sur l'icône de modification
  const handleEditClick = (patientId) => {
		// Trouver les informations du patient par son ID
		const patient = patients.find(p => p.id === patientId);
		setFirstName(patient.name.split(' ')[0]); 
		setLastName(patient.name.split(' ')[1]);
		setGender(patient.gender);
		setBirthDate(patient.birthDate);
		setPatientToUpdate(patientId);
		setShowUpdateModal(true);
  };
  
  // Fonction pour soumettre les modifications
  const handleUpdateSubmit = async (event) => {
	  event.preventDefault(); // Prévenir le comportement de soumission par défaut

	  // Construire l'objet de données du patient à partir des états
	  const updatedPatientData = {
		resourceType: "Patient",
		id: patientToUpdate,
		name: [{ use: "official", family: lastName, given: [firstName] }],
		gender: gender,
		birthDate: birthDate,
	  };

	  // Envoi de la requête PUT au serveur FHIR pour mettre à jour le patient
	  try {
		const response = await fetch(`https://hapi.fhir.org/baseR5/Patient/${patientToUpdate}`, {
		  method: 'PUT',
		  headers: {
			'Content-Type': 'application/fhir+json',
		  },
		  body: JSON.stringify(updatedPatientData),
		});

		if (!response.ok) throw new Error('Failed to update patient');

		console.log('Patient updated successfully');
		setShowUpdateModal(false); // Fermer la fenêtre modale de mise à jour
		
		// Par contre cette partie j'étais un peu short en temps (étonnant), il faut faire f5 pour voir le résultat ^^
	  } catch (error) {
		console.error('Error:', error);
	  }
	};
	
	//constantes pour la soumission d'une requête d'ajout (POST/create dans le CRUD) grâce à un envoi de JSON
  
  const handleSubmit = (event) => {
  event.preventDefault();
  const patientData = {
      resourceType: "Patient",
      name: [{ use: "official", family: lastName, given: [firstName] }],
      gender: gender,
      birthDate: birthDate,
    };

    fetch('https://hapi.fhir.org/baseR5/Patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
      },
      body: JSON.stringify(patientData),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
      setShowModal(false);
      // Actualisez ici la liste des patients si nécessaire
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };
  
  // la partie suivante représente les balises d'organisation de notre application, avec la barre de recherche, les icones, la table des patients, les boutons en bas
  // pour l'ajout et la navigation (dans un seul sens haha) dans la liste, et enfin les fenêtres modales (qui s'ouvrent et se ferment de manière conditionnelle)
  
  return (
    <div className="container">
      <h1>Patients</h1>
      
	  <input
        type="text"
        placeholder="Rechercher..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <FontAwesomeIcon icon={faSearch} onClick={handleSearchClick} />
	  
	  
	  <Table striped bordered hover>
		  <thead>
			<tr>
			  <th>ID</th>
			  <th>Name</th>
			  <th>Gender</th>
			  <th>Birth Date</th>
			  <th>Actions</th>
			</tr>
		  </thead>
		  <tbody>
			{patients.map((patient) => (
			  <tr key={patient.id}>
				<td>{patient.id}</td>
				<td>{patient.name}</td>
				<td>{patient.gender}</td>
				<td>{patient.birthDate}</td>
				<td>
				  <FontAwesomeIcon icon={faTrashCan} onClick={() => handleDeleteClick(patient.id)} />
				  <FontAwesomeIcon icon={faPencil} onClick={() => handleEditClick(patient.id)} />
				</td>
			  </tr>
			))}
		  </tbody>
	  </Table>
	  
      <Button variant="primary" onClick={handleNextPage} disabled={!nextPageUrl}>Suivant</Button>
	  <Button variant="primary" onClick={() => setShowModal(true)}>Ajouter un patient</Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit ={handleSubmit}>
            <Form.Group>
              <Form.Label>Nom</Form.Label>
              <Form.Control type="text" placeholder="Nom de famille" onChange={(e) => setLastName(e.target.value)} />
              <Form.Label>Prénom</Form.Label>
              <Form.Control type="text" placeholder="Prénom" onChange={(e) => setFirstName(e.target.value)} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Genre</Form.Label>
              <Form.Control as="select" onChange={(e) => setGender(e.target.value)}>
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="unknown">unknown</option>
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>Date de naissance</Form.Label>
              <Form.Control type="date" onChange={(e) => setBirthDate(e.target.value)} />
            </Form.Group>
            <Button variant="primary" type="submit">Enregistrer</Button>
          </Form>
        </Modal.Body>
      </Modal>
	
	  
	  <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirmation de suppression</Modal.Title>
        </Modal.Header>
        <Modal.Body>Êtes-vous sûr de vouloir supprimer ce patient ?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleConfirmDelete}>Supprimer</Button>
        </Modal.Footer>
      </Modal>
	  
	   <Modal show={showUpdateModal} onHide={() => setShowUpdateModal(false)}>
		  <Modal.Header closeButton>
			<Modal.Title>Mettre à jour le patient</Modal.Title>
		  </Modal.Header>
		  <Modal.Body>
			<Form onSubmit={handleUpdateSubmit}>
			  <Form.Group>
				<Form.Label>Prénom</Form.Label>
				<Form.Control 
				  type="text" 
				  value={firstName} 
				  onChange={(e) => setFirstName(e.target.value)} 
				/>
			  </Form.Group>
			  <Form.Group>
				<Form.Label>Nom</Form.Label>
				<Form.Control 
				  type="text" 
				  value={lastName} 
				  onChange={(e) => setLastName(e.target.value)} 
				/>
			  </Form.Group>
			  <Form.Group>
				<Form.Label>Genre</Form.Label>
				<Form.Control 
				  as="select" 
				  value={gender} 
				  onChange={(e) => setGender(e.target.value)}
				>
				  <option value="male">male</option>
				  <option value="female">female</option>
				  <option value="other">unknown</option>
				</Form.Control>
			  </Form.Group>
			  <Form.Group>
				<Form.Label>Date de naissance</Form.Label>
				<Form.Control 
				  type="date" 
				  value={birthDate} 
				  onChange={(e) => setBirthDate(e.target.value)} 
				/>
			  </Form.Group>
			  <Button variant="primary" type="submit">Mettre à jour</Button>
			</Form>
		  </Modal.Body>
		</Modal>
	  
    </div>
  );
}
// oui
export default App;