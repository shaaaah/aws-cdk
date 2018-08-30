import cdk = require('@aws-cdk/cdk');
import { cloudformation, ResourceId } from './apigateway.generated';
import { Method } from './method';
import { RestApi } from './restapi';

export interface IRestApiResource {
    /**
     * The rest API that this resource is part of.
     *
     * The reason we need the RestApi object itself and not just the ID is because the model
     * is being tracked by the top-level RestApi object for the purpose of calculating it's
     * hash to determine the ID of the deployment. This allows us to automatically update
     * the deployment when the model of the REST API changes.
     */
    readonly resourceApi: RestApi;

    /**
     * The ID of the resource.
     */
    readonly resourceId: ResourceId;

    /**
     * Defines a new child resource where this resource is the parent.
     * @param pathPart The path part for the child resource
     * @returns A Resource object
     */
    newResource(pathPart: string): Resource;

    /**
     * Defines a new method for this resource.
     * @param httpMethod The HTTP method
     */
    newMethod(httpMethod: string): Method;
}

export interface ResourceProps {
    /**
     * The parent resource of this resource. You can either pass another
     * `Resource` object or a `RestApi` object here.
     */
    parent: IRestApiResource;

    /**
     * A path name for the resource.
     */
    pathPart: string;
}

export class Resource extends cdk.Construct implements IRestApiResource {
    public readonly resourceApi: RestApi;
    public readonly resourceId: ResourceId;

    constructor(parent: cdk.Construct, id: string, props: ResourceProps) {
        super(parent, id);

        validateResourcePathPart(props.pathPart);

        const resource = new cloudformation.Resource(this, 'Resource', {
            restApiId: props.parent.resourceApi.restApiId,
            parentId: props.parent.resourceId,
            pathPart: props.pathPart
        });

        this.resourceId = resource.ref;
        this.resourceApi = props.parent.resourceApi;

        const deployment = props.parent.resourceApi.latestDeployment;
        if (deployment) {
            deployment.addDependency(resource);
            deployment.addToLogicalId({
                resource: {
                    resourceId: props.parent.resourceId,
                    pathPath: props.pathPart
                }
            });
        }
    }

    public newResource(pathPart: string): Resource {
        return new Resource(this, pathPart, { parent: this, pathPart });
    }

    public newMethod(httpMethod: string): Method {
        return new Method(this, httpMethod, { resource: this, httpMethod });
    }
}

function validateResourcePathPart(part: string) {
    // strip {} which indicate this is a parameter
    if (part.startsWith('{') && part.endsWith('}')) {
        part = part.substr(1, part.length - 2);
    }

    if (!/^[a-zA-Z0-9\.\_\-]+$/.test(part)) {
        throw new Error(`Resource's path part only allow a-zA-Z0-9._- and curly braces at the beginning and the end: ${part}`);
    }
}
