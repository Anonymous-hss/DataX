import React from 'react';
import { 
  SapLogo, 
  PostgresLogo, 
  MongoLogo, 
  SnowflakeLogo, 
  BigQueryLogo, 
  S3Logo 
} from '../../icons/DatabaseLogos';

export const SOURCES_CATALOG = [
  {
    id: 'sap_bw',
    name: 'SAP BW / S/4HANA',
    badge: 'Certified clean core',
    badgeType: 'blue',
    desc: 'Purchasing (0PUR_C01), Inventory (0IC_C03), Material master (MARA)',
    Logo: SapLogo,
    defaultRows: 1420,
    cleanRows: 1140,
    autoFixedRows: 219,
    quarantineRows: 61,
    compliance: 98.4
  },
  {
    id: 'postgres',
    name: 'PostgreSQL Enterprise',
    badge: 'Active driver',
    badgeType: 'green',
    desc: 'Relational ACID store with pooling and SSL',
    Logo: PostgresLogo,
    defaultRows: 3120,
    cleanRows: 2840,
    autoFixedRows: 210,
    quarantineRows: 70,
    compliance: 97.8
  },
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    badge: 'NoSQL document',
    badgeType: 'gray',
    desc: 'BSON customer data and e-commerce transactions',
    Logo: MongoLogo,
    defaultRows: 8450,
    cleanRows: 7890,
    autoFixedRows: 440,
    quarantineRows: 120,
    compliance: 98.6
  },
  {
    id: 'snowflake',
    name: 'Snowflake Data Cloud',
    badge: 'Virtual warehouse',
    badgeType: 'blue',
    desc: 'Analytics landing tables with zero-copy cloning',
    Logo: SnowflakeLogo,
    defaultRows: 5600,
    cleanRows: 5210,
    autoFixedRows: 320,
    quarantineRows: 70,
    compliance: 98.7
  },
  {
    id: 'bigquery',
    name: 'Google BigQuery',
    badge: 'Columnar SQL',
    badgeType: 'blue',
    desc: 'Real-time serverless warehouse with streaming ingestion',
    Logo: BigQueryLogo,
    defaultRows: 4200,
    cleanRows: 3950,
    autoFixedRows: 190,
    quarantineRows: 60,
    compliance: 98.5
  },
  {
    id: 'aws_s3',
    name: 'AWS S3 Parquet Lake',
    badge: 'Object storage',
    badgeType: 'gray',
    desc: 'Delta lake partitions and compressed column parquet',
    Logo: S3Logo,
    defaultRows: 6800,
    cleanRows: 6310,
    autoFixedRows: 390,
    quarantineRows: 100,
    compliance: 98.5
  }
];

/**
 * SourceStep - Connect an enterprise source (Step 1 of 4)
 */
export default function SourceStep({ selectedSourceId, onSelectSource }) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[#5F6678] dark:text-slate-400">
        Select and authenticate your ERP, warehouse or document database.
      </p>

      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {SOURCES_CATALOG.map(src => {
          const isSelected = selectedSourceId === src.id;
          const LogoComponent = src.Logo;

          return (
            <div
              key={src.id}
              onClick={() => onSelectSource(src.id)}
              className={`p-3.5 rounded-[16px] border flex items-center justify-between cursor-pointer transition-all ${
                isSelected
                  ? 'border-2 border-[#2D55F5] bg-[#F0F4FF]/50 dark:bg-blue-950/20 shadow-xs'
                  : 'border-[#E3E6EE] dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-[#2D55F5]/40'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#F5F6FA] dark:bg-white/[0.06] border border-[#CDD2DE]/50 dark:border-white/[0.08] flex items-center justify-center shrink-0">
                  <LogoComponent size={24} />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs sm:text-sm text-[#0A0F1F] dark:text-white">
                      {src.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      src.badgeType === 'blue'
                        ? 'bg-[#EEF2FF] text-[#2D55F5] border border-blue-200/60'
                        : src.badgeType === 'green'
                        ? 'bg-[#ECFDF5] text-[#22845E] border border-[#34D399]/40'
                        : 'bg-[#EDEFF5] text-[#5F6678] border border-[#CDD2DE]/60'
                    }`}>
                      {src.badge}
                    </span>
                  </div>
                  <p className="text-xs text-[#5F6678] dark:text-slate-400 mt-0.5 truncate">
                    {src.desc}
                  </p>
                </div>
              </div>

              <div className="ml-3 shrink-0">
                {isSelected ? (
                  <span className="w-5 h-5 rounded-full border-2 border-[#2D55F5] bg-[#2D55F5] flex items-center justify-center shrink-0">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-[#CDD2DE] dark:border-slate-700 shrink-0 inline-block" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

