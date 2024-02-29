import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';


function App() {
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
	  fetch('https://hapi.fhir.org/baseR5/Patient')
		.then(response => response.json())
		.then(data => {
		  const fetchedPatients = data.entry.map(entry => {
			const givenName = entry.resource.name && entry.resource.name[0].given && entry.resource.name[0].given.length > 0 ? entry.resource.name[0].given.join(' ') : 'Unknown';
			const familyName = entry.resource.name && entry.resource.name[0].family ? entry.resource.name[0].family : 'Name';
			return {
			  id: entry.resource.id,
			  name: `${givenName} ${familyName}`,
			  gender: entry.resource.gender,
			  birthDate: entry.resource.birthDate
			};
		  });
		  setPatients(fetchedPatients);
		})
		.catch(error => console.error('Error fetching patients:', error));
	}, []);
	
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
  
  return (
    <div className="container">
      <h1>Patients</h1>
      <Button variant="primary" onClick={() => setShowModal(true)}>Ajouter un patient</Button>
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
				</td>
			  </tr>
			))}
		  </tbody>
	  </Table>

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
    </div>
  );
}

export default App;