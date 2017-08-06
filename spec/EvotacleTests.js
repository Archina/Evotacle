describe('ResourceFactory', function() {

  beforeEach(module('Evotacle'))

  var $factory;

  beforeEach(inject(function(Ressources){
    // The injector unwraps the underscores (_) from around the parameter names when matching
    $factory = Ressources;
  }));

  it('can instanciate a new resource.', function() {
    var $scope = {};
    //This can be used if all controller have been injected through _$controller_
    //var controller = $controller('PasswordController', { $scope: $scope });
    var itemCount = $factory.Instances.length
    var resource = new $factory.Class("Chickens")
    expect(resource.name).toEqual('Chickens')
    expect($factory.Instances.length).toEqual(itemCount+1)
  })

})
