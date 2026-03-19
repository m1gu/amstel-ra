import React from 'react';
import logosImg from '../assets/images/logos.png';
import lineasInferior from '../assets/images/lineas-doradas-superior.png';

const GlobalFooter = ({ className = '' }) => {
    return (
        <div className={`global-footer ${className}`.trim()}>
            {/* Fila 1: Logos Composite */}
            <div className="gf-row-logos">
                <img src={logosImg} alt="Conmebol y Amstel" className="gf-logo-composite" />
            </div>

            {/* Fila 2: Arcos Dorados */}
            <div className="gf-row-arches">
                <img src={lineasInferior} alt="" className="gf-arches" />
            </div>

            {/* Fila 3: Texto Legal */}
            <div className="gf-row-legal">
                © ADVERTENCIA: EL CONSUMO EXCESIVO DE ALCOHOL PUEDE PERJUDICAR SU SALUD. MINISTERIO DE SALUD PÚBLICA DEL ECUADOR.
            </div>
        </div>
    );
};

export default GlobalFooter;
