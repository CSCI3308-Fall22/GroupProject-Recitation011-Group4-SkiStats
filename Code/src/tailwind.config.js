const config = {
    content: ['./src/**/*.{html,js,ejs}'],

    theme: {
        extend: {}
    },

    plugins: [
        require('daisyui'),
    ],

    daisyui: {
        themes: ['coffee'],
    },
};

module.exports = config;