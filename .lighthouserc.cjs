module.exports = {
  ci: {
    collect: {
      staticDistDir: '.',
      url: [
        'index.html',
        'projects/ec-homologation-toyota-proace-city.html',
        'projects/brake-hardware-calipers-pads-carriers.html'
      ],
      numberOfRuns: 1
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0 }],
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
