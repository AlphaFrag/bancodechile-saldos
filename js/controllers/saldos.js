(function() {
    var app = angular.module('saldosController', ["highcharts-ng"]);
    //////////////////////////////////////////////////////////////////GLOBALES
    var currentProduct = {};
    var currentDocument = {};

    //Setea el slider
    var setSlider = function(slider) {
            new window.NinjaSlider(slider, {
                auto: 3000,
                transitionCallback: function(index, slide, container) {
                    var $slider = angular.element(container),
                        $bullets = $slider.find('.slide-control'),
                        $numbers = $slider.prev().find('.change-number');
                    $bullets.removeClass('active').filter('[data-slide="' + index + '"]').addClass('active');
                    $numbers.text(index + 1);
                }
            });
        }

    //Formatea los números en pesos
    var setPesos = function(number, decimals, dec_point, thousands_sep) {
            number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
            var n = !isFinite(+number) ? 0 : +number,
                prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
                dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
                s = '',
                toFixedFix = function(n, prec) {
                    var k = Math.pow(10, prec);
                    return '' + (Math.round(n * k) / k).toFixed(prec);
                };
            // Fix for IE parseFloat(0.55).toFixed(0) = 0;
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || '';
                s[1] += new Array(prec - s[1].length + 1).join('0');
            }
            return s.join(dec);
        }
        //////////////////////////////////////////////////////////////////FILTROS
        //Filtro para el formato de peso: $xxx.xxx.xxx
    app.filter('pesos', function() {
            return function(input) {
                var out = "";
                out = setPesos(input, 0, ',', '.');
                return out;
            };
        })
    app.filter("sanitizeHTML", ['$sce', function($sce) {
      return function(htmlCode){
        return $sce.trustAsHtml(htmlCode);
      }
    }]);
        //////////////////////////////////////////////////////////////////SERVICIOS
    app.service('productService', function() {
        var addProduct = function(producto) {
            currentProduct = producto;
        }
        var addDocument = function(cheque) {
            currentDocument = cheque;
        }
        return {
            addProduct: addProduct,
            addDocument: addDocument
        };
    });

    //////////////////////////////////////////////////////////////////DIRECTIVAS
    //Setea el slider cuando se finaliza el DOM
    app.directive('onLastRepeatSlider', function() {
        return function(scope, element, attrs) {
            if (scope.$last) setTimeout(function() {
                setSlider(document.querySelector(".slider"));
            }, 1);
        };
    })

    //////////////////////////////////////////////////////////////////CONTROLADORES
    //Carga información del Banco y de la App
    app.controller("saldosGetData", function($scope, $http) {
        $http.get('model/generales.json').
        success(function(data, status, headers, config) {
            $scope.banco = data.banco;
            $scope.aplicacion = data.aplicacion;
        }).
        error(function(data, status, headers, config) {});
    });

    //Controlador para aplicación Saldos en general
    app.controller("mainController", function($scope, $location, $http, productService) {
        $scope.isDeployedMenu = false; //Inicializa variable para setear el menú desplegado por defecto
        $scope.currentProduct = currentProduct;
        $scope.currentDocument = currentDocument;
        var self = this;
        //Función que obtiene la información del usuario a partir de una URL, retorna JSON con los valores
        this.saldosGetUser = function() {
            $http.get('model/user.json?r=' + Math.random()).
            success(function(data, status, headers, config) {
                $scope.userData = data;
                //Inicializa variables y procesos
                self.setParameters();
            }).
            error(function(data, status, headers, config) {});
        }
        this.setParameters = function() {
            //Setea el número de mensajes no vistos según parámetro del JSON
            $scope.mensajes = $scope.userData.mensajes; //Se almacenanlos mensajes
            $scope.mensajesPendientes = 0;
            $scope.mensajes.forEach(function(element, index) {
                if (element.visto === false) {
                    $scope.mensajesPendientes++; //Se cuentan los mensajes no leídos
                }
            });
            //Setea si se despliegan los banners
            $scope.ad = $scope.userData.ads;
        }
        this.setChartCorriente = function() {
            $scope.chartSeries = [{
                "name": 'Año ' + currentProduct.charts.series[0].ano,
                "data": currentProduct.charts.series[0].data,
                "color": '#7D8A96',
                "dashStyle": 'ShortDash',
                "marker": {
                    "radius": 2
                }
            }, {
                "name": currentProduct.charts.series[1].ano,
                "data": currentProduct.charts.series[1].data,
                "color": '#003579',
                "dataLabels": {
                    "enabled": true,
                    "color": '#003579',
                    "align": 'center',
                    "style": {
                        "font-weight": 'bold',
                        "font-size": '13px'
                    },
                    "verticalAlign": 'top',
                    "formatter": function() {
                        var formato = setPesos(this.y, 0, ',', '.');
                        return '$' + formato;
                    }
                },
                "marker": {
                    "fillColor": '#FFFFFF',
                    "lineWidth": 2,
                    "lineColor": null,
                    "symbol": 'circle'
                }
            }];
            $scope.chartDates = ['17 Mayo', '17 Junio', '17 Julio'];
            $scope.chartConfig = {
                options: {
                    chart: {
                        type: 'area',
                        height: 200
                    },
                    plotOptions: {
                        series: {
                            fillOpacity: 0.1
                        }
                    }
                },
                title: {
                    text: false
                },
                yAxis: {
                    title: {
                        text: null
                    },
                    labels: {
                        enabled: false
                    }
                },
                xAxis: {
                    categories: $scope.chartDates
                },
                credits: {
                    enabled: false
                },
                series: $scope.chartSeries,
            }
        }
        this.setChartTarjeta = function() {
            $scope.chartSeries = [
                ['Disponible', 390000],
                ['Bencina', 10000],
                ['mercancía', 100000],
                ['Farmacia', 30000],
                ['Otros', 130000]
            ]
            $scope.chartConfig = {
                options: {
                    chart: {
                        type: 'pie',
                        height: 200
                    },
                    plotOptions: {
                        pie: {
                            size: '90%',
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: {
                                enabled: true,
                                connectorColor: 'transparent',
                                distance: 3,
                                formatter: function() {
                                    var html = "";
                                    var formato = setPesos(this.y, 0, ',', '.');
                                    var color = this.point.name == 'Disponible' ? '#2C7E00' : '#3388CC';
                                    formato = '$' + formato;
                                    return '<p>' + this.point.name + '</p><br/><b style="color:' + color + '; font-weight:bold;">' + formato + '</b>';
                                },
                            }
                        }
                    }
                },
                title: {
                    text: false
                },
                credits: {
                    enabled: false
                },
                series: [{
                    data: $scope.chartSeries
                }]
            }
            Highcharts.setOptions({
                colors: ['#2C7E00', '#3388CC', '#5098D3', '#85B7E0', '#AFD0EB']
            });
        }
        this.saldosGetUser();
        //Genera el gráfico de área solo si existe el gráfico y esta en la vista corriente o tarjeta
        if (angular.element('.chart').length > 0 && currentProduct.vista == 'corriente') {
            this.setChartCorriente();
        } else if (angular.element('.chart').length > 0 && currentProduct.vista == 'tarjeta') {
            this.setChartTarjeta();
        }
        // this.setChartTarjeta();
        ////////////////////////DELEGACIONES
        //Despliega el menú principal
        this.deployMenu = function() {
                $scope.isDeployedMenu = $scope.isDeployedMenu == true ? false : true;
            }
            //Mueve el slider
        this.moveSlideTo = function(targetSlidenum) {
            ninjaSliderObj = angular.element('.slider').get(0).ninjaSlider;
            ninjaSliderObj.slide(targetSlidenum);
        }
        this.goToView = function(view, producto, plainView) {
            if( plainView ){
                $scope.tituloVista = plainView;
            } 
            else {
                productService.addProduct(producto);
                currentProduct.titulo = 'Saldo ' + currentProduct.nombre;
            }
            
            $location.path(view) //.replace();
        }
        this.goToDocument = function(cheque) {
            var documentObj;
            currentProduct.titulo = 'Saldo ' + currentProduct.nombre
            currentProduct.ultimosCheques.forEach(function(element, index) {
                if (element.numero === cheque) {
                    documentObj = element;
                }
            });
            productService.addDocument(documentObj);
            $location.path('document') //.replace();
        }
        this.goToConfig = function() {
            currentProduct.titulo = 'Configuración'
            $location.path('config') //.replace();
        }
        this.goTo = function( view, title ){
            currentProduct.titulo = title;
            $location.path(view) //.replace();
        }
        this.goBack = function() {
            window.history.back();
        }

        this.expandableBoxControl = function( state ){
            if( state === 'expanded' ){ return 'collapsed'; }
            return 'expanded';
        }
    });

    //Controlador para formularios en general
    app.controller("generalFormController", function($scope, $location, $http) {
        var cont = 1;
        $scope.response = 0;
        $scope.responseDigipass = 0;
        $scope.isSubmitted = false;
        $scope.isSubmittedBlock = false;
        $scope.isDisabled = false;
        $scope.isUnblockDigipass = false;
        //Función que comprueba el primer log
        this.addReview = function() {
            $scope.isSubmitted = true;
            //Cuando el formulario es válido
            if ($scope.reviewForm.$valid) {
                //Comprobar clave:
                $http.get('model/response.json').
                success(function(data, status, headers, config) {
                    $scope.response = data.respuesta;
                    //Si la respuesta es 1 (Clave correcta), entra a la home de la app
                    if ($scope.response == 1) {
                        $location.path('inicio') //.replace();
                    }
                    //Si la respuesta es 2 (Clave incorrecta) más de 4 veces, entonces se bloquea
                    if ($scope.response == 2) {
                        $scope.clave = "";
                        cont++;
                        if (cont >= 5) {
                            $scope.response = 3;
                            $scope.isDisabled = true;
                        }
                    }
                }).
                error(function(data, status, headers, config) {});
            }
        }

        //Función que comprueba el digipass
        this.unblock = function() {
            $scope.isSubmittedBlock = true;
            if ($scope.bloquedForm.$valid) {
                //Compruebo si el formulario tiene contenido y compruebo digipass
                $http.get('model/responseDigipass.json').
                success(function(data, status, headers, config) {
                    $scope.responseDigipass = data.respuesta;
                    if ($scope.responseDigipass == 1) {
                        //Se reinicia el formulario
                        cont = 1;
                        $scope.isUnblockDigipass = true;
                        $scope.response = 0;
                        $scope.responseDigipass = 0;
                        $scope.isSubmitted = false;
                        $scope.isSubmittedBlock = false;
                        $scope.digipass = "";
                        $scope.isDisabled = false;
                    }
                }).
                error(function(data, status, headers, config) {});
            }
        }
        this.validateRut = function(value) {
            $scope.isSubmitted = true;
            $scope.isValidRut = $.Rut.validar($scope.rut) && $scope.rut.length > 6;
            $scope.isValidPass = $scope.forgotForm.claveInternet.$valid
            if ($scope.forgotForm.$valid) {
                $http.get('model/responseForgot.json').
                success(function(data, status, headers, config) {
                    $scope.response = data.respuesta;
                    //Si la respuesta es 1 envía al enrolamiento
                    if ($scope.response == 1) {
                        //TODO: enviar al enrolamiento
                    }
                    //Si la respuesta es 2 (Rut incorrecto)
                    else if ($scope.response == 2) {
                        $scope.isValidRut = false;
                    }
                    //Si la respuesta es 3 (Clave incorrecta)
                    else if ($scope.response == 3) {
                        $scope.isValidPass = false;
                    }
                    //Si la respuesta es 4 (Rut y clave incorrectas)
                    else if ($scope.response == 4) {
                        $scope.isValidRut = false;
                        $scope.isValidPass = false;
                    }
                }).
                error(function(data, status, headers, config) {});
            }
        }

        /// funcion que envia formulario en "cambiar clave de seguridad"
        this.sendChangePassForm = function(){
            $scope.isSubmitted = true;
            if ($scope.changePassForm.$valid) {
                $http.get('model/changePass.json').
                success(function(data, status, headers, config) {
                    $scope.response = data.respuesta;
                    if ($scope.response == 1) {
                        $scope.isValidPass = true;
                        
                        // envia a la configuracion
                        window.history.back();                        
                    } else {
                        $scope.isValidPass = false;
                    }
                }).error(function(data, status, headers, config) {});
            }
        }
    });

})();