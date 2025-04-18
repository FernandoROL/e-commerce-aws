import { DynamoDB } from "aws-sdk";
import { Order, OrderRepository } from "/opt/nodejs/ordersLayer";
import { Product, ProductRepository } from "/opt/nodejs/productRepository";
import * as awsxray from "aws-xray-sdk";
import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import {
  CarrierType,
  OrderProduct,
  OrderRequest,
  OrderResponse,
  PaymentType,
  ShippingType,
} from "./layers/ordersApiLayer/nodejs/orderApi";

awsxray.captureAWS(require("aws-sdk"));
const ordersDdb = process.env.ORDERS_DDB!;
const productsDdb = process.env.PRODUCTS_DDB!;

const ddbClient = new DynamoDB.DocumentClient();

const orderRepository = new OrderRepository(ddbClient, ordersDdb);
const productRepository = new ProductRepository(ddbClient, productsDdb);

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const apiRequestId = event.requestContext.requestId;
  const lambdaRequestId = context.awsRequestId;

  console.log(
    `API Gateway RequestId: ${apiRequestId} - LambdaRequestId: ${lambdaRequestId}`
  );

  if (method === "GET") {
    if (event.queryStringParameters) {
      const email = event.queryStringParameters!.email;
      const orderId = event.queryStringParameters!.orderId;

      if (email) {
        if (orderId) {
          // Get one order from an user
          try {
            const order = await orderRepository.getOrder(email, orderId);
            return {
              statusCode: 200,
              body: JSON.stringify(convertToOrderResponse(order)),
            };
          } catch (error) {
            console.log((<Error>error).message);
            return {
              statusCode: 404,
              body: (<Error>error).message,
            };
          }
        } else {
          // Get all orders from an user
          const order = await orderRepository.getOrdersByEmail(email);

          return {
            statusCode: 200,
            body: JSON.stringify(order.map(convertToOrderResponse)),
          };
        }
      }
    } else {
      // GET all orders
      const orders = await orderRepository.getAllOrders();
      return {
        statusCode: 200,
        body: JSON.stringify(orders.map(convertToOrderResponse)),
      };
    }
  } else if (method === "POST") {
    console.log("POST /orders");
    const orderRequest = JSON.parse(event.body!) as OrderRequest;
    const products = await productRepository.getProductsById(
      orderRequest.productIds
    );
    if (products.length === orderRequest.productIds.length) {
      const order = buildOrder(orderRequest, products);
      const orderCreated = await orderRepository.createOrder(order);

      return {
        statusCode: 200,
        body: JSON.stringify(convertToOrderResponse(orderCreated)),
      };
    } else {
      return {
        statusCode: 404,
        body: "Not all products were found",
      };
    }
  } else if (method === "DELETE") {
    console.log("DELETE /orders");
    const email = event.queryStringParameters!.email!;
    const orderId = event.queryStringParameters!.orderId!;

    try {
      const orderDelete = await orderRepository.deleteOrder(email, orderId);
      return {
        statusCode: 200,
        body: JSON.stringify(convertToOrderResponse(orderDelete)),
      };
    } catch (err) {
      console.log((<Error>err).message);
      return {
        statusCode: 404,
        body: (<Error>err).message,
      };
    }
  }
  return {
    statusCode: 400,
    body: `Bad request.\n\nEvent method: ${event.httpMethod}\nEvent body: ${event.body}\nPath parameters${event.queryStringParameters}`,
  };
}

function convertToOrderResponse(order: Order): OrderResponse {
  const orderProducts: OrderProduct[] = [];
  order.products.forEach((product) => {
    orderProducts.push({
      code: product.code,
      price: product.price,
    });
  });
  const orderResponse: OrderResponse = {
    email: order.pk,
    id: order.sk!,
    createdAt: order.createdAt!,
    products: orderProducts,
    billing: {
      payment: order.billing.payment as PaymentType,
      totalPrice: order.billing.totalPrice,
    },
    shipping: {
      type: order.shipping.type as ShippingType,
      carrier: order.shipping.carrier as CarrierType,
    },
  };

  return orderResponse;
}

function buildOrder(orderRequest: OrderRequest, products: Product[]): Order {
  const orderProduct: OrderProduct[] = [];
  let totalPrice = 0;

  products.forEach((product) => {
    totalPrice += product.price;
    orderProduct.push({
      code: product.code,
      price: product.price,
    });
  });
  const order: Order = {
    pk: orderRequest.email,
    billing: {
      payment: orderRequest.payment,
      totalPrice: totalPrice,
    },
    shipping: {
      type: orderRequest.shipping.type,
      carrier: orderRequest.shipping.carrier,
    },
    products: orderProduct,
  };
  return order;
}
