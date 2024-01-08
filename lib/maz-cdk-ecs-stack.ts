import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as ec2 from 'aws-cdk-lib/aws-ec2';


export class MazCdkEcsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // SQS Queue
    const queue = new sqs.Queue(this, 'MyQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'MyCluster');

    // ECS Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'MyTaskDefinition');

    // Define your container details here
    const container = taskDefinition.addContainer('MyContainer', {
      image: ecs.ContainerImage.fromRegistry('php:8.2-cli'),
    });

// Create a new VPC
    const myVpc = new ec2.Vpc(this, 'MyVpc', {
      maxAzs: 2, // Adjust the number of availability zones as needed
    });
    
    // Define the security group
const mySecurityGroup = new ec2.SecurityGroup(this, 'MySecurityGroup', {
  vpc: myVpc, // Replace myVpc with your actual VPC
  description: 'Allow inbound traffic from Systems Manager service on port 443',
});

    // Allow inbound traffic from Systems Manager service on port 443
    mySecurityGroup.addIngressRule(
      ec2.Peer.ipv4('172.31.0.0/16'),//52.95.36.0/22'),//54.239.30.80/32'), // Replace with the Systems Manager service IP range
      ec2.Port.tcp(443),
      'Allow inbound from Systems Manager service'
    );

// Allow inbound traffic from Systems Manager service on port 443
mySecurityGroup.addIngressRule(
  ec2.Peer.ipv4('54.239.30.80/32'), // Replace with the Systems Manager service IP range
  ec2.Port.tcp(443),
  'Allow inbound from Systems Manager service'
);

    const ssmAgentContainer = taskDefinition.addContainer('ssm-agent', {
     image: ecs.ContainerImage.fromRegistry('amazonlinux'),
     essential: true,
     command: ['sh', '-c', 'amazon-linux-extras enable ssm-agent && yum install -y amazon-ssm-agent'],
     user: 'root',
    });


    // ECS Service
    const service = new ecs.FargateService(this, 'MyService', {
      cluster,
      taskDefinition,
      securityGroups: [mySecurityGroup]
    });

    // Lambda Function
   /* const handler = new lambda.Function(this, 'MyLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'), // Path to your Lambda function code
      environment: {
        ECS_CLUSTER_NAME: cluster.clusterName,
        ECS_SERVICE_NAME: service.serviceName,
        SQS_QUEUE_URL: queue.queueUrl,
      },
    });*/

    // Grant permissions for Lambda to receive messages from SQS
   // queue.grantConsumeMessages(handler);

/* Todo: deploying this fails. debug it please first
    // Schedule the Lambda function to run every week on Sundays
    new events.Rule(this, 'WeeklySchedule', {
      schedule: events.Schedule.cron({ minute: '0', hour: '0', day: 'SUN' }),
      targets: [new targets.LambdaFunction(handler)],
    });*/
  }
}

