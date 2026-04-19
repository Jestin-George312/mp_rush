import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  const classes = ['rounded-2xl p-6 bg-[rgb(var(--color-card))] border-[rgb(var(--color-border))] shadow-sm transition-shadow hover:shadow-md', className].filter(Boolean).join(' ');
  return <div className={classes}>{children}</div>;
};

export default Card;
