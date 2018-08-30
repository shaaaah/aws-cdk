import { expect } from '@aws-cdk/assert';
import cdk = require('@aws-cdk/cdk');
import { Test } from 'nodeunit';
import apigateway = require('../lib');
import { Stack, App } from '@aws-cdk/cdk';

// tslint:disable:max-line-length
// tslint:disable:object-literal-key-quotes

export = {
    '"name" is defaulted to construct id'(test: Test) {
        const stack = new cdk.Stack();
        new apigateway.RestApi(stack, 'my-first-api', { autoDeploy: false });
        expect(stack).toMatch({
          "Resources": {
            "myfirstapi5827A5AA": {
              "Type": "AWS::ApiGateway::RestApi",
              "Properties": {
                "Name": "my-first-api"
              }
            }
          }
        });

        test.done();
    },

    '"name" can be undefined if "body" is specified'(test: Test) {
        const stack = new cdk.Stack();
        new apigateway.RestApi(stack, 'bla', {
            autoDeploy: false,
            body: new apigateway.RestApiBody()
        });
        expect(stack).toMatch({
            "Resources": {
              "blaBE223B94": {
                "Type": "AWS::ApiGateway::RestApi",
                "Properties": {
                  "Body": {},
                  "BodyS3Location": {}
                }
              }
            }
        });
        test.done();
    },

    'minimal setup (just a name)'(test: Test) {
        const stack = new cdk.Stack();

        new apigateway.RestApi(stack, 'my-api');

        expect(stack).toMatch({
          "Resources": {
            "myapi4C7BF186": {
              "Type": "AWS::ApiGateway::RestApi",
              "Properties": {
                "Name": "my-api"
              }
            },
            "myapiLatestDeployment24E142F7": {
              "Type": "AWS::ApiGateway::Deployment",
              "Properties": {
                "RestApiId": {
                  "Ref": "myapi4C7BF186"
                }
              },
              "DeletionPolicy": "Retain"
            },
            "myapiDeploymentStage252BF8C8": {
              "Type": "AWS::ApiGateway::Stage",
              "Properties": {
                "RestApiId": {
                  "Ref": "myapi4C7BF186"
                },
                "DeploymentId": {
                  "Ref": "myapiLatestDeployment24E142F7"
                },
                "StageName": "prod"
              }
            }
          }
        });

        test.done();
    },

    'fails in synthesis if there are no methods'(test: Test) {
        const app = new App();
        const stack = new Stack(app, 'my-stack');

        const api = new apigateway.RestApi(stack, 'API');

        api.newResource('foo');
        api.newResource('bar').newResource('goo');

        test.throws(() => app.synthesizeStack(stack.name), /The REST API doesn't contain any methods/);
        test.done();
    },

    'newChildResource can be used on IRestApiResource to form a tree'(test: Test) {
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'restapi', {
            autoDeploy: false,
            name: 'my-rest-api'
        });

        const foo = api.newResource('foo');
        api.newResource('bar');

        foo.newResource('{hello}');

        expect(stack).toMatch({
          "Resources": {
            "restapiC5611D27": {
              "Type": "AWS::ApiGateway::RestApi",
              "Properties": {
                "Name": "restapi"
              }
            },
            "restapifooF697E056": {
              "Type": "AWS::ApiGateway::Resource",
              "Properties": {
                "ParentId": {
                  "Fn::GetAtt": [
                    "restapiC5611D27",
                    "RootResourceId"
                  ]
                },
                "PathPart": "foo",
                "RestApiId": {
                  "Ref": "restapiC5611D27"
                }
              }
            },
            "restapifoohello6E7449A9": {
              "Type": "AWS::ApiGateway::Resource",
              "Properties": {
                "ParentId": {
                  "Ref": "restapifooF697E056"
                },
                "PathPart": "{hello}",
                "RestApiId": {
                  "Ref": "restapiC5611D27"
                }
              }
            },
            "restapibar1F6A2522": {
              "Type": "AWS::ApiGateway::Resource",
              "Properties": {
                "ParentId": {
                  "Fn::GetAtt": [
                    "restapiC5611D27",
                    "RootResourceId"
                  ]
                },
                "PathPart": "bar",
                "RestApiId": {
                  "Ref": "restapiC5611D27"
                }
              }
            }
          }
        });

        test.done();
    },

    'resource path cannot use "/"'(test: Test) {
        const stack = new cdk.Stack();
        const api = new apigateway.RestApi(stack, 'restapi', { name: 'my-rest-api' });
        test.throws(() => api.newResource('foo/'));
        test.done();
    },

    'fails if autoDeployStageOptions is set with autoDeploy disabled'(test: Test) {
        const stack = new cdk.Stack();
        test.throws(() => {
            new apigateway.RestApi(stack, 'myapi', { autoDeploy: false, autoDeployStageOptions: { stageName: 'foo' }});
        }, `Cannot set 'autoDeployStageOptions' if 'autoDeploy' is disabled`);
        test.done();
    },

    'fails if autoDeployOptions is set with autoDeploy disabled'(test: Test) {
        const stack = new cdk.Stack();
        test.throws(() => {
            new apigateway.RestApi(stack, 'myapi', { autoDeploy: false, autoDeployOptions: { retainDeployments: false }});
        }, `Cannot set 'autoDeployOptions' if 'autoDeploy' is disabled`);
        test.done();
  }
};