import { Navbar, Container, Button } from 'react-bootstrap';

const Topbar = ({ onToggleSidebar }) => {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm">
      <Container fluid>
        <Button variant="outline-primary" onClick={onToggleSidebar}>
          ☰
        </Button>
        <Navbar.Brand className="ms-3">Automation Panel</Navbar.Brand>
      </Container>
    </Navbar>
  );
};

export default Topbar;
