import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from './frontend/pages/homePage';
import ProfilePage from './frontend/pages/profilePage/profilePafe';
import Header from './frontend/layouts/header/header';
import Footer from './frontend/layouts/footer/footer';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/profile/:cccd" element={<ProfilePage />} />
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
