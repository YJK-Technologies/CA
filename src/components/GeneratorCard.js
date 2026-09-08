import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const GeneratorCard = ({ icon, title, description, to, accent = 'primary', disabled = false }) => {
    const navigate = useNavigate();

    return (
        <motion.div
            className={`generator-card generator-card-${accent} ${disabled ? 'generator-card-disabled' : ''}`}
            whileHover={disabled ? {} : { y: -6, scale: 1.015 }}
            whileTap={disabled ? {} : { scale: 0.985 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        >
            <div className="generator-card-icon">{icon}</div>
            <h3 className="generator-card-title">{title}</h3>
            <p className="generator-card-desc">{description}</p>
            <button
                className="generator-card-btn"
                onClick={() => !disabled && navigate(to)}
                disabled={disabled}
            >
                Generate <span className="arrow">&rarr;</span>
            </button>
        </motion.div>
    );
};

export default GeneratorCard;
