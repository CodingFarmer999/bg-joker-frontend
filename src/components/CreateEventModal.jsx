import { useState } from 'react';
import toast from 'react-hot-toast';
import '../pages/admin/AdminPage.css';

const GAME_TYPES = [
    { code: 'BOARD_GAME', label: '桌遊' },
    { code: 'MTG', label: '魔法風雲會' },
    { code: 'POKEMON', label: '寶可夢 PTCG' },
    { code: 'YUGIOH', label: '遊戲王' },
    { code: 'FAB', label: '血肉之戰 (Flesh and Blood)' },
    { code: 'WS', label: 'Weiß Schwarz (黑白雙翼)' },
];

// 產生 00:00 ~ 23:30，每 30 分鐘一個選項
const TIME_OPTIONS = [];
for (let h = 0; h < 24; h++) {
    const hh = String(h).padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:00`);
    TIME_OPTIONS.push(`${hh}:30`);
}

const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

const CreateEventModal = ({ onClose, onSuccess }) => {
    const [form, setForm] = useState({
        title: '',
        gameType: 'BOARD_GAME',
        eventDate: today,
        eventTimeSlot: '19:00',
        maxParticipants: 4,
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim()) {
            toast.error('請填寫活動名稱');
            return;
        }
        if (!form.eventDate) {
            toast.error('請選擇活動日期');
            return;
        }

        const token = localStorage.getItem('joker_token');
        const shopId = localStorage.getItem('joker_selected_store_id');
        const combinedDateTime = `${form.eventDate}T${form.eventTimeSlot}`;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/events/propose', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    shopId: shopId ? parseInt(shopId) : null,
                    gameType: form.gameType,
                    title: form.title.trim(),
                    description: form.description.trim(),
                    eventTime: new Date(combinedDateTime).toISOString(),
                    maxParticipants: parseInt(form.maxParticipants),
                }),
            });

            if (response.ok) {
                toast.success('揪團已提交，等待管理員審核！');
                onSuccess?.();
                onClose();
            } else if (response.status === 401) {
                toast.error('請先登入才能發起揪團');
            } else {
                toast.error('提交失敗，請稍後再試');
            }
        } catch (err) {
            console.error('Failed to propose event:', err);
            toast.error('提交失敗，請稍後再試');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div
                className="modal-content admin-modal animated-fade"
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{ maxWidth: '520px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0 }}>發起揪團</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-muted)', cursor: 'pointer', lineHeight: 1 }}
                    >&times;</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>活動名稱 *</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="例：週末寶可夢對戰揪團"
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>遊戲類型 *</label>
                        <select
                            name="gameType"
                            value={form.gameType}
                            onChange={handleChange}
                            required
                        >
                            {GAME_TYPES.map(g => (
                                <option key={g.code} value={g.code}>{g.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>活動日期 *</label>
                            <input
                                type="date"
                                name="eventDate"
                                value={form.eventDate}
                                onChange={handleChange}
                                min={today}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>活動時間 *</label>
                            <select
                                name="eventTimeSlot"
                                value={form.eventTimeSlot}
                                onChange={handleChange}
                            >
                                {TIME_OPTIONS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>人數上限 *（2～100 人）</label>
                        <input
                            type="number"
                            name="maxParticipants"
                            value={form.maxParticipants}
                            onChange={handleChange}
                            min={2}
                            max={100}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>活動說明</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="請描述活動內容、規則或注意事項…"
                            rows={4}
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                        提交後將由管理員審核，審核通過後才會公開顯示。
                    </p>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
                            取消
                        </button>
                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? '提交中…' : '送出揪團'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateEventModal;
