import React from 'react';

// Official PostgreSQL elephant mark
export const PostgresLogo = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 256 264" fill="none" className={`shrink-0 ${className}`}>
    <path
      d="M136.2 3.6c-17.6-5.8-37.4 2.8-44.4 19.3-5.3 12.5-4.4 26.9-4.2 40.3.3 15.6.8 31.2.6 46.8-.2 14.8-5.3 29.3-16.7 39.1-8.5 7.3-19.4 11.4-30.6 12.3-12.7 1-25.7-3.2-34.9-12-6.5-6.2-10.7-14.7-11.8-23.6-1.5-12.2 2.6-24.8 11.2-33.5 10.6-10.7 26.5-15.5 41.2-12.8 3.5.7 6.9 1.8 10.1 3.2 2.7-7.7 7.7-14.3 14.3-19.1-8.5-4.5-18.4-6.3-28-5.5-22.1 1.8-42.3 16.4-49.3 37.5-6.4 19.4-1.2 41.9 13.5 56.4 14.6 14.4 36.3 19.5 56.2 13.9 12.7-3.6 24-11.9 31.5-22.7 8.7 18.5 24.3 33 43.6 40.5 11.4 4.4 23.7 6.3 35.9 5.8 22.3-1 43.5-12.6 55.4-31.3 11-17.3 13.5-38.9 7.6-58.6-4.5-15-13.7-28.1-26.2-37.2-14.7-10.7-33-15.9-51.2-14.4-3.5.3-7 .9-10.4 1.8.8-14.1 4.5-28.1 12.7-39.7 6.1-8.6 14.8-15.5 25.1-18.7 4.1-1.3 8.3-2 12.6-2.1 7.4-.1 14.7 1.9 21.1 5.6 2.5-4.2 4.4-8.8 5.6-13.6-10.4-6.4-22.8-9.4-34.9-8.4-8.3.7-16.5 3.3-23.8 7.5z"
      fill="#336791"
    />
    <path
      d="M178.5 86.8c15.6 6.5 27.6 19.8 32.8 35.9 5.6 17.5 2.8 37-7.4 52.3-10.7 16-29.3 25.5-48.4 24.6-16-.8-30.8-9.7-39.5-23.1 7.2-6.5 15.6-11.5 24.8-14.8 14.4-5.1 30.3-5.2 44.8-.4 3.9 1.3 7.6 3 11 5.2-1.2-12.3-7.2-23.7-16.8-31.6-12.3-10.1-29-14-44.5-10.5-5.3 1.2-10.3 3.3-14.9 6.2 3.1-9.9 8.6-18.9 16.2-26 12.8-12 30.5-17.9 41.9-17.8z"
      fill="#4382B7"
    />
    <path
      d="M121 161.4c-9.1 3.2-17.4 8.2-24.5 14.5 9.7 13.9 24.9 23.3 41.6 25.4 17.6 2.2 35.6-4.5 47.3-17.6-3.8-2.6-7.9-4.7-12.2-6.2-16.1-5.7-34-5.8-50.2-.4-.7.2-1.3.4-2 .7z"
      fill="#FFFFFF"
    />
  </svg>
);

// Official Snowflake logo
export const SnowflakeLogo = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
    <path
      d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93M12 2l2 3M12 2l-2 3M12 22l2-3M12 22l-2-3M2 12l3 2M2 12l3-2M22 12l-3 2M22 12l-3-2M4.93 4.93l3.54.71M4.93 4.93l.71 3.54M19.07 19.07l-3.54-.71M19.07 19.07l-.71-3.54M4.93 19.07l3.54-.71M4.93 19.07l.71-3.54M19.07 4.93l-3.54.71M19.07 4.93l-.71 3.54"
      stroke="#29B5E8"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.5" fill="#29B5E8" />
  </svg>
);

// Official SAP logo
export const SapLogo = ({ size = 28, className = '' }) => (
  <svg width={size} height={size * 0.5} viewBox="0 0 56 28" fill="none" className={`shrink-0 ${className}`}>
    <path d="M0 0h36l20 28H0V0z" fill="#007DB8" />
    <path d="M36 0h20L36 28H16L36 0z" fill="#005B94" opacity="0.6" />
    <text x="7" y="19" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="900" fill="#FFFFFF" letterSpacing="1">
      SAP
    </text>
  </svg>
);

// Official MongoDB leaf logo
export const MongoLogo = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
    <path
      d="M12 1.5C11.5 2 7 8 7 14c0 3 2 6 5 8.5 3-2.5 5-5.5 5-8.5 0-6-4.5-12-5-12.5z"
      fill="#00ED64"
    />
    <path
      d="M12 1.5v21c3-2.5 5-5.5 5-8.5 0-6-4.5-12-5-12.5z"
      fill="#00C450"
    />
    <path
      d="M12 2.5v19.5c-.3-.2-.6-.4-.9-.7C9.3 19.3 8 16.8 8 14c0-4.8 3.3-9.7 4-11.5z"
      fill="#00684A"
      opacity="0.3"
    />
  </svg>
);

// Official AWS S3 bucket logo
export const S3Logo = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
    <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" fill="#E05243" />
    <path d="M12 2l9 5-9 5-9-5 9-5z" fill="#FF7F66" />
    <path d="M12 12v10l9-5V7l-9 5z" fill="#C93B2B" />
    <path d="M12 12L3 7v10l9 5V12z" fill="#B32B1C" />
    <path d="M7 9l5 2.8L17 9" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Official Apache Kafka logo
export const KafkaLogo = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
    <circle cx="6" cy="12" r="3" fill="#231F20" />
    <circle cx="17" cy="6" r="3" fill="#231F20" />
    <circle cx="17" cy="18" r="3" fill="#231F20" />
    <path d="M8.5 10.8l6-3.6M8.5 13.2l6 3.6" stroke="#231F20" strokeWidth="1.75" />
  </svg>
);

// Google BigQuery logo
export const BigQueryLogo = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`shrink-0 ${className}`}>
    <rect width="24" height="24" rx="6" fill="#ECF3FE" />
    <circle cx="11" cy="11" r="5" stroke="#4285F4" strokeWidth="2" fill="none" />
    <path d="M14.5 14.5L19 19" stroke="#4285F4" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M9 11h4M11 9v4" stroke="#4285F4" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Generic Database Icon
export const DatabaseIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
);
