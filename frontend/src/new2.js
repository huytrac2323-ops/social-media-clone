// Trong AppContent.jsx hoặc HomePage.jsx
import {useAuth} from './AuthContext';

function HomePage() {
    const {currentUser} = useAuth(); // Lấy currentUser trực tiếp
    // ...
}
    