#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ProducrsAppStack } from '../lib/productsApp-stack';
import { ECommerceApiStack } from '../lib/ecommerceApi-stack';
import { ProductsAppLayerStack } from '../lib/productsAppLayers-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.AWS_ACCOUNT_ID,
  region: process.env.AWS_REGION
}

const tags = {
  const: "ECommerce",
  team: "FernandoROL"
}

const productsAppLayerStack = new ProductsAppLayerStack(app, "ProductsAppLayers", {
  tags: tags,
  env: env
})

const productsAppStack = new ProducrsAppStack(app, "ProductsApp", {
  tags: tags,
  env: env
})
productsAppStack.addDependency(productsAppLayerStack)

const eCommerceApiStack = new ECommerceApiStack(app, "ECommerceApi", {
  productsFetchHandler: productsAppStack.productsFetchHandler,
  productsAdminHandler: productsAppStack.productsAdminHandler,
  tags: tags,
  env: env
})

eCommerceApiStack.addDependency(productsAppStack)