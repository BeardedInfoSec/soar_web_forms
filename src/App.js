import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import FormBuilder from './FormBuilder';
import FormViewer from './FormViewer';

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<FormBuilder />} />
      <Route path="/:formName" element={<FormViewer />} />
    </Routes>
  </Router>
);

export default App;
