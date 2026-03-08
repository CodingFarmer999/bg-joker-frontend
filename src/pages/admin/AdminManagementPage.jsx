import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import AdminHeader from '../../components/AdminHeader';
import './AdminManagementPage.css';

const AdminManagementPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        displayName: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('joker_token');
            const response = await fetch('/api/admin/users/create-admin', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('管理員帳號建立成功！');
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    displayName: ''
                });
            } else {
                const errorMsg = await response.text();
                toast.error(`建立失敗: ${errorMsg}`);
            }
        } catch (err) {
            console.error('Error creating admin:', err);
            toast.error('系統發生錯誤，無法建立管理員');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="dashboard-container">
            <AdminHeader />
            <main className="dashboard-content">
                <header className="content-header">
                    <h1>👥 管理員設定</h1>
                    <p className="subtitle">建立新的管理員帳號以協助管理平台。</p>
                </header>

                <section className="admin-creation-section">
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>使用者帳號 (Login ID)</label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required
                                placeholder="請輸入帳號"
                            />
                        </div>

                        <div className="form-group">
                            <label>電子郵件 (Email)</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="example@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>密碼 (Password)</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                placeholder="請輸入高強度密碼"
                            />
                        </div>

                        <div className="form-group">
                            <label>顯示名稱 (Display Name)</label>
                            <input
                                type="text"
                                name="displayName"
                                value={formData.displayName}
                                onChange={handleChange}
                                required
                                placeholder="例如：店長小王"
                            />
                        </div>

                        <button
                            type="submit"
                            className="login-btn submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '建立中...' : '建立管理員帳號'}
                        </button>
                    </form>
                </section>
            </main>
        </div>
    );
};

export default AdminManagementPage;
