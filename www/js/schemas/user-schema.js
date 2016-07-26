'use strict';

angular.module('dywos.schemas')
  .config(['validationSchemaProvider', function(validationSchemaProvider) {

    // Defining schema
    var Login = {
      globals: {
        'validations': 'required',
        'validate-on': 'submit'
      },
      email: {
        //'validations': 'email',
        'messages': {
          'required': {
            'error': 'Ingres&aacute; una dirección de email'
            }
        }
      },
      password: {
        'messages': {
          'required': {
              'error': 'Ingres&aacute; la contraseña'
          }
        } 
      }
    };
/*
    var ForgotPassword = {
      globals: {
        'validations': 'email',
        'validate-on': 'submit'
      },
      email: {
        'messages': {
          'email': {
            'error': 'Ingres&aacute; una dirección de email'
          }
        }
      }
    };

    var RegisterStep1 = {
      globals: {
        'validations': 'required',
        'validate-on': 'blur',
        'messages': {
          'required': {
            'error': 'El %field% es requerido'
          }
        }
      },
      email: {
        'validations': 'email'
      },
      password: {},
      passwordMatch: {},
      secretQuestion: {},
      answer: {},
      agreement: {}
    };

    var RegisterStep2 = {
      globals: {
        'validations': 'required',
        'messages': {
          'required': {
            'error': 'El %field% es requerido'
          }
        }
      },
      name: {},
      lastname: {},
      phone: {},
      phoneCarrier: {},
      documentType: {},
      documentNumber: {},
      sex: {},
      birthday: {}
    };

*/
    validationSchemaProvider.set('Login', Login);
    //validationSchemaProvider.set('ForgotPassword', ForgotPassword);

    //validationSchemaProvider.set('RegisterStep1', RegisterStep1);
    //validationSchemaProvider.set('RegisterStep2', RegisterStep2);
  }]);