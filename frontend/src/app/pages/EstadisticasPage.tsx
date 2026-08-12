import React from 'react';

const EstadisticasPage: React.FC = () => {
  const iframeUrl = "https://datastudio.google.com/embed/reporting/15df7659-dfc0-4371-aa65-e5c78855214f/page/1CK6F";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Estadísticas</h1>
        <div className="w-full h-[800px] border border-border">
          <iframe
            src={iframeUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default EstadisticasPage;
