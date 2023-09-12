  const config = {
    name: 'Imports tactill',
    sheets: [
      {
        name: 'Produits : création et modification',
        slug: 'catalog',
        fields: [
          {
            key: 'name',
            type: 'string',
            label: 'Nom',
            description: 'Nom du produit',
            constraints: [
              {
                type: 'required',
              },
            ],
          },
          {
            key: 'var1',
            type: 'string',
            label: 'Variation 1',
            description: 'Premier niveau de variation. Exemple de format attendu Taille=XL',
          },
          {
            key: 'var2',
            type: 'string',
            label: 'Variation 2',
            description: 'Deuxième niveau de variation. Exemple de format attendu Taille=XL',
          },
          {
            key: 'var3',
            type: 'string',
            label: 'Variation 3',
            description: 'Troisième niveau de variation. Exemple de format attendu Taille=XL',
          },
          {
            key: 'category',
            type: 'string',
            label: 'Catégorie',
            description: 'Catégorie du produit',
            constraints: [
              {
                type: 'required',
              },
            ],
          },
          {
            key: 'tax',
            type: 'number',
            label: 'Taxe',
            description: 'Taux de taxe sur le produit en %',
            constraints: [
              {
                type: 'required',
              },
            ],
          },
          {
            key: 'reference',
            type: 'string',
            label: 'Référence',
            description: 'Référence du produit',
          },
          {
            key: 'sellPrice',
            type: 'number',
            label: 'Prix de vente',
            description: 'Prix de vente du produit',
          },
          {
            key: 'buyPrice',
            type: 'number',
            label: "Prix d'achat",
            description: "Prix d'achat du produit",
          },
          {
            key: 'barcode',
            type: 'string',
            label: 'Code-barres',
            description: 'Code-barres du produit',
          },
          {
            key: 'tags',
            type: 'string',
            label: 'Tags',
            description: 'Liste de tous les tags du produit, séparés par des &. Exemple : tag1&tag2&tag3',
          },
          {
            key: 'createdAt',
            type: 'string',
            label: 'Date de création',
            description: 'Date de création du produit, au format AAAA-MM-JJTHH:mm:ss.SSSZ',
          },
          {
            key: 'miniature',
            type: 'string',
            label: 'Miniature',
            description: "Url de l'image du produit ou couleur de la tuile associée",
          },
        ],
        actions: [
          {
            label: 'Ajouter un niveau de variation',
            operation: 'sheet:addVariation',
            mode: 'foreground',
            primary: false,
          },
        ],
      },
      {
        name: 'Clients : création',
        slug: 'customer',
        fields: [
          {
            key: 'firstName',
            type: 'string',
            label: 'Prénom',
          },
          {
            key: 'lastName',
            type: 'string',
            label: 'Nom',
          },
          {
            key: 'email',
            type: 'string',
            label: 'Email',
          },
          {
            key: 'phone',
            type: 'string',
            label: 'Téléphone',
            description: 'Numéro de téléphone au format international. Exemple : +33612345678',
          },
          {
            key: 'companyName',
            type: 'string',
            label: 'Nom entreprise',
          },
          {
            key: 'address',
            type: 'string',
            label: 'Adresse',
          },
          {
            key: 'zipcode',
            type: 'string',
            label: 'Code postal',
          },
          {
            key: 'city',
            type: 'string',
            label: 'Ville',
          },
          {
            key: 'country',
            type: 'string',
            label: 'Pays',
          },
          {
            key: 'note',
            type: 'string',
            label: 'Note',
          },
          {
            key: 'fidelityCardNumber',
            type: 'string',
            label: 'Numéro carte fidélité',
          },
          {
            key: 'createdAt',
            type: 'string',
            label: 'Date de création',
            description: 'Date de création du client, au format AAAA-MM-JJTHH:mm:ss.SSSZ',
          },
        ],
      },
    ],
    actions: [
      {
        label: 'Valider',
        operation: 'workbook:submit',
        description: "Vous êtes sur le point d'importer vos données dans Tactill. Voulez-vous continuer ?",
        mode: 'foreground',
        primary: true,
        confirm: true,
      },
    ],
  }


