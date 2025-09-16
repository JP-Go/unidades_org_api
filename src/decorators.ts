import { trace, context, Span } from '@opentelemetry/api';
import { tracer } from './instrumentations';

export function MethodWithTracing() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {};
    return descriptor;
  };
}

/**
 * `WithTracing` is a class decorator that automatically instruments all methods of a class with OpenTelemetry tracing.
 * It starts a new span for each method call, sets attributes, and adds events to the span.
 *
 * @param {Function} target - The constructor function of the class to decorate.
 * @todo Figure out why it overrides other method decoratos
 */
export function WithTracing(target: Function) {
  const objDescriptors = Object.getOwnPropertyDescriptors(target.prototype);

  const methodsDescriptors = Object.entries(objDescriptors).filter(
    ([name, descriptor]) =>
      name !== 'constructor' && typeof descriptor.value === 'function',
  );

  for (const [propertyName, descriptor] of methodsDescriptors) {
    const isMethod = descriptor.value instanceof Function;
    if (!isMethod) continue;

    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const currentSpan = trace.getActiveSpan();

      const methodName = target.name + ':' + propertyName;

      let span: Span;
      if (currentSpan) {
        const ctx = trace.setSpan(context.active(), currentSpan);
        span = tracer.startSpan(methodName, undefined, ctx);
      } else {
        span = tracer.startSpan(methodName);
      }
      span.setAttribute('call_id', crypto.randomUUID());
      span.setAttribute('called_at', Bun.nanoseconds());

      span.setAttribute('method_name', methodName);
      span.setAttribute('method_arguments', JSON.stringify(args));

      span.addEvent(`Call to ${methodName} with ${JSON.stringify(args)} `);

      const result = originalMethod?.apply(this, args);

      span.addEvent(`Ended ${methodName}`);

      span.setAttribute('call_ended_at', Bun.nanoseconds());
      span.end();

      return result;
    };

    Object.defineProperty(target.prototype, propertyName, descriptor);
  }
}
