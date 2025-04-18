import * as cdk from "aws-cdk-lib";
import * as lambdaNodeJS from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as cwlogs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";

interface ECommerceApiProps extends cdk.StackProps {
  productsFetchHandler: lambdaNodeJS.NodejsFunction;
  productsAdminHandler: lambdaNodeJS.NodejsFunction;
  ordersHandler: lambdaNodeJS.NodejsFunction;
}

export class ECommerceApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ECommerceApiProps) {
    super(scope, id, props);

    const logGroup = new cwlogs.LogGroup(this, "ECommerceApiLogs");
    const api = new apigateway.RestApi(this, "ECommerceApi", {
      restApiName: "ECommerceApi",
      cloudWatchRole: true,
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          caller: true,
          user: true,
        }), // Geração de logs sempre geram custo + podem vazar informações do usuário - - Usar somente em ambiente de desenvolvimento
      },
    });

    this.createProductsService(props, api);

    this.createOrdersService(props, api);
  }

  private createOrdersService(
    props: ECommerceApiProps,
    api: apigateway.RestApi
  ) {
    const orderIntegration = new apigateway.LambdaIntegration(
      props.ordersHandler
    );
    // resource - /orders
    const ordersResource = api.root.addResource("orders");

    // GET /orders
    // GET /orders?email=email@email.com
    // GET /orders?email=email@email.com&orderId=123
    ordersResource.addMethod("GET", orderIntegration);

    // DELETE /orders?email=email@email.com&orderId=123
    ordersResource.addMethod("DELETE", orderIntegration, {
      requestParameters: {
        "method.request.querystring.email": true,
        "method.request.querystring.password": true,
      },
    });

    // POST /prders
    ordersResource.addMethod("POST", orderIntegration);
  }

  private createProductsService(
    props: ECommerceApiProps,
    api: apigateway.RestApi
  ) {
    const producsFetchInteration = new apigateway.LambdaIntegration(
      props.productsFetchHandler
    );

    // "/products"
    const productsResource = api.root.addResource("products");
    productsResource.addMethod("GET", producsFetchInteration);

    // GET /products/{id}
    const productIdResource = productsResource.addResource("{id}");
    productIdResource.addMethod("GET", producsFetchInteration);

    const productsAdminIntegration = new apigateway.LambdaIntegration(
      props.productsAdminHandler
    );

    // POST /products
    productsResource.addMethod("POST", productsAdminIntegration);

    // PUT /products/{id}
    productIdResource.addMethod("PUT", productsAdminIntegration);

    // DELETE /products/{id}
    productIdResource.addMethod("DELETE", productsAdminIntegration);
  }
}
