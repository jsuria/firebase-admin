var fba = angular.module('fba', ['ngRoute', 'angularResizable', 'jsonFormatter']).run(function ($http, dataFactory, connection, $rootScope) {
  const userPath = electron.app.getPath('userData')
  const fs = require('graceful-fs')
  try {
    var config = fs.readFileSync(userPath + '/fba-config.json', 'utf8')
    config = JSON.parse(config)
  } catch (err) {
    config = false
  }
  if (!config) {
    connection.create()
  } else {
    var fireApp = firebase.initializeApp(config.connections[0])
  }
})

.controller('mainController', function (dataFactory, dataBin, $rootScope, $scope, $location) {
  $scope.os = process.platform
  $scope.result = 'No Data'
  $scope.collections = []
  $scope.query = ''
  $scope.activeUrl = ''
  $scope.listShown = false
  let query = ''

  var dbRef = firebase.database().ref('/')
  const baseURL = dbRef.root.toString()

  dbRef.on('value', function (snapshot) {
    let tempCols = []
    snapshot.forEach(function (childSnapshot) {
      tempCols.push(childSnapshot.key)
    })
    $scope.$apply(function () {
      $scope.collections = tempCols
    })
    $('.menu-overlay').hide()
  }, function (err) {
    $scope.result = 'The read failed: ' + err.code
  })

  $scope.create = function () {
    let top = electron.BrowserWindow.getFocusedWindow()
    let child = new electron.BrowserWindow({parent: top, width: 600, height: 300})
    child.on('closed', () => { child = null })
    child.loadURL(`file://${__dirname}/create.html`)
  }

  $scope.get = function (name) {
    dbRef.child(name).on('value', function (snapshot) {
      $scope.result = snapshot.val()
      // query = baseURL + name
      query = `firebase.database().ref('/').child('${name}')`
      $('#query').val(query).trigger('input')
      $scope.activeUrl = name
    }, function (err) {
      $scope.result = 'The read failed: ' + err.code
    })
  }

  $scope.run = function () {
    query = $('#query').val()
    try {
      eval(query).on('value', function (snapshot) {
        $scope.result = snapshot.val()
      }, function (err) {
        $scope.result = 'The read failed: ' + err.code
      })
    } catch (err) {
      $scope.result = 'Ooops.. There is an error":\n"' + err.message
    }
  }
})

.controller('connectionController', function ($scope) {
  $scope.apiKey = ''
  $scope.authDomain = ''
  $scope.databaseURL = ''

  $scope.save = function () {
    const userPath = electron.app.getPath('userData')
    let val = {
      connections: [
        {
          apiKey: $scope.apiKey,
          authDomain: $scope.authDomain,
          databaseURL: $scope.databaseURL
        }
      ]
    }

    try {
      writeFile.sync(userPath + '/fba-config.json', JSON.stringify(val, null, '\t'), {mode: parseInt('0600', 8)})
    } catch (err) {
      if (err.code === 'EACCES') {
        err.message = err.message + '\nYou don\'t have access to this file.\n'
      }
      throw err
    }
  }
})

.factory('dataFactory', function ($http) {
  var myService = {
    httpRequest: function (url, method, params, dataPost, upload) {
      var passParameters = {}
      passParameters.url = url

      if (typeof method === 'undefined') {
        passParameters.method = 'GET'
      } else {
        passParameters.method = method
      }

      if (typeof params !== 'undefined') {
        passParameters.params = params
      }

      if (typeof dataPost !== 'undefined') {
        passParameters.data = dataPost
      }

      if (typeof upload !== 'undefined') {
        passParameters.upload = upload
      }

      var promise = $http(passParameters).then(function (response) {
        if (typeof response.data === 'string' && response.data !== 1) {
          $.gritter.add({
            title: 'Shopvel',
            text: response.data
          })
          return false
        }
        if (response.data.jsMessage) {
          $.gritter.add({
            title: response.data.jsTitle,
            text: response.data.jsMessage
          })
        }
        return response.data
      }, function () {
        $.gritter.add({
          title: 'Shopvel',
          text: 'An error occured.'
        })
      })
      return promise
    }
  }
  return myService
})

.directive('tooltip', function () {
  return {
    restrict: 'A',
    link: function (scope, element) {
      $(element).hover(function () {
        $(element).tooltip('show')
      }, function () {
        $(element).tooltip('hide')
      })
    }
  }
})

.service('dataBin', function () {
  return {
    getData: function (key) {
      return JSON.parse(localStorage.getItem(key))
    },
    setData: function (key, value) {
      localStorage.setItem(key, JSON.stringify(value))
    },
    delData: function (key) {
      localStorage.removeItem(key)
    }
  }
})

.service('connection', function () {
  return {
    create: function () {
      let top = electron.BrowserWindow.getFocusedWindow()
      let child = new electron.BrowserWindow({parent: top, width: 600, height: 400})
      child.on('closed', () => { child = null })
      child.loadURL(`file://${__dirname}/create.html`)
    }
  }
})
