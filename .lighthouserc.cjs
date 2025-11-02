module.exports = {
  ci: {
    collect: {
      startServerCommand: 'sleep 5 && python3 -m http.server 3000',
      url: [
        'http://localhost:3000/index.html',
        'http://localhost:3000/projects/ec-homologation-toyota-proace-city.html'
      ],
      numberOfRuns: 1
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
