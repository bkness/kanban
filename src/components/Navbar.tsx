

export default function Navbar() {
    return (
        <nav className="nav">
            <div className="nav-left">
                <div className="nav-brand">
                    <div className="nav-brand-icon">⊞</div>
                    Kabana De´ Bkness
                </div>
                <div className="nav-divider"></div>
                <div className="nav-breadcrumb">
                    <span>Product</span>
                    <span className="nav-sep">/</span>
                    <span className="active">Launch board</span>
                </div>
            </div>
            <div className="nav-right">
                <div className="avatar-group">
                    <div className="avatar">AL</div>
                    <div className="avatar">MK</div>
                    <div className="avatar">JD</div>
                </div>
                <div className="nav-div" style={{ width: '1px', height: '16px', background: 'var(--border)' }}></div>
                <button className="btn-ghost">⬡ Filters</button>
                <button className="btn-primary">+ New Card</button>
            </div>
        </nav>
    );
}