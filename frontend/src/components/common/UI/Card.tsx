import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  const classes = ['rounded-2xl p-6 bg-[rgb(var(--color-card))] border-[rgb(var(--color-border))] shadow-sm transition-shadow hover:shadow-md', className].filter(Boolean).join(' ');
  return <div className={classes} {...props}>{children}</div>;
};

export default Card;
