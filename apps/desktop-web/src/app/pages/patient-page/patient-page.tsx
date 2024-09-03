import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { DetailedPatientDto, ListPatientDto } from '@contact-patient/dtos';
import { Button, Descriptions, Skeleton } from 'antd';
import axios from 'axios';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { RouteComponentProps, useHistory } from 'react-router-dom';
import { PatientOverviewUrl } from '../urls';
import { PatientUrl } from '../urls';

type Patients = { patients: ListPatientDto[] };
export type PatientPageProps = RouteComponentProps<{ patientId: string }>;

export function PatientPage(props: PatientPageProps) {
  // Get the history object for navigation
  const history = useHistory();

  // Get the patient ID from the URL
  const patientId = props?.match?.params?.patientId;

  // Retrieve state from history
  const { patients } = history.location.state as Patients;

  // Detailed patient state
  const [patient, setPatient] = useState<DetailedPatientDto>();

  // State for loading detailed patient
  const [loadingPatient, setLoadingPatient] = useState(false);

  // TODO - implement
  const [currentPatientIndex, setCurrentPatientIndex] = useState(0);
  const totalPatients = patients.length ?? 0;

  /**
   * Fetch patient details when ID changes.
   */
  useEffect(() => {
    if (!patientId) {
      return;
    }

    setLoadingPatient(true);

    axios
      .get(`http://localhost:3333/patients/${patientId}`)
      .then((response) => {
        if (response?.data) {
          setPatient(response.data);
        }
        setLoadingPatient(false);
      });
  }, [patientId]);

  /**
   * Function for marking a patient as contacted or not contacted.
   * @param newContactedValue
   */
  const markContacted = (newContactedValue: boolean) => {
    if (!patient) return;

    // Update local state immediately for better UX
    setPatient({ ...patient, contacted: newContactedValue });

    // Make a PATCH request to update the database
    axios
      .patch(`http://localhost:3333/patients/${patientId}`, {
        contacted: newContactedValue,
      })
      .catch((error) => {
        console.error('Error updating patient:', error);
        // Optionally, revert the local state if the update fails
        setPatient({ ...patient, contacted: !newContactedValue });
      });
  };

  /**
   * Function for going to the previous patient.
   */
  const goToPreviousPatient = () => {
    setCurrentPatientIndex(currentPatientIndex - 1);
    const previousPatient = patients[currentPatientIndex - 1];
    history.push({
      pathname: PatientUrl.replace(':patientId', previousPatient.id),
      state: { patients },
    });
  };

  /**
   * Function for going to the next patient.
   */
  const goToNextPatient = () => {
    setCurrentPatientIndex(currentPatientIndex + 1);
    const nextPatient = patients[currentPatientIndex + 1];
    history.replace({
      pathname: PatientUrl.replace(':patientId', nextPatient.id),
      state: { patients },
    });
  };

  // If loading patient, show loading animation
  if (loadingPatient) {
    return <Skeleton />;
  }

  // If no patient found for id, show error message
  if (!patient) {
    return <p>No patient found for id: "{patientId}"</p>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '50px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Button
            icon={<LeftOutlined />}
            onClick={() => history.push(PatientOverviewUrl)}
          />
          <h1>
            ({currentPatientIndex + 1} / {totalPatients}) Patient: {patient.ssn}
          </h1>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <Button
            type="primary"
            onClick={() => goToPreviousPatient()}
            icon={<LeftOutlined />}
            disabled={currentPatientIndex === 0}
          />
          <Button
            type="primary"
            onClick={() => markContacted(!patient.contacted)}
          >
            {patient.contacted ? 'Mark not contacted' : 'Mark contacted'}
          </Button>
          <Button
            type="primary"
            onClick={() => goToNextPatient()}
            icon={<RightOutlined />}
            disabled={currentPatientIndex === totalPatients - 1}
          />
        </div>
      </div>

      <Descriptions>
        <Descriptions.Item label="First name">
          {patient.firstName}
        </Descriptions.Item>
        <Descriptions.Item label="Last name">
          {patient.lastName}
        </Descriptions.Item>
        <Descriptions.Item label="Contacted">
          {patient.contacted ? 'Yes' : 'No'}
        </Descriptions.Item>
        <Descriptions.Item label="Gender">
          {patient.gender?.name}
        </Descriptions.Item>
        <Descriptions.Item label="Patient created">
          {format(new Date(patient.created), 'dd-MM-yyyy')}
        </Descriptions.Item>
        <Descriptions.Item label="Patient updated">
          {format(new Date(patient.updated), 'dd-MM-yyyy')}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
}
