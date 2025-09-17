import { trace, context, Span } from '@opentelemetry/api';

/**
 * `WithTracing` is a class decorator that automatically instruments all methods of a class with OpenTelemetry tracing.
 * It starts a new span for each method call, sets attributes, and adds events to the span.
 *
 * @param {Function} target - The constructor function of the class to decorate.
 * @todo Figure out why it overrides other method decoratos
 */
// Utilizamos Function pois esse decorator pode ser aplicado em qualquer definição de classe
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function WithTracing(target: Function) {
  const objDescriptors = Object.getOwnPropertyDescriptors(target.prototype);

  const methodsDescriptors = Object.entries(objDescriptors).filter(
    ([name, descriptor]) =>
      name !== 'constructor' && typeof descriptor.value === 'function',
  );
  const tracer = trace.getTracer(target.name);

  for (const [propertyName, descriptor] of methodsDescriptors) {
    const isMethod = descriptor.value instanceof Function;
    if (!isMethod) continue;

    // Utilizamos any nesta função pois como estamos sobrescrevendo um método por meio de reflection não temos
    // acesso à tipagem em tempo de compilação portanto não temos como inferir explicitamente
    // o tipo dos argumentos da função.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const originalMethod: (...args: any[]) => unknown = descriptor.value;

    // Novamente, não podemos inferir explicitamente o tipo dos argumentos da função em tempo de compilação.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      span.setAttribute('called_at', Date.now());

      span.setAttribute('method_name', methodName);
      span.setAttribute('method_arguments', JSON.stringify(args));

      span.addEvent(`Call to ${methodName} with ${JSON.stringify(args)} `);

      const result = originalMethod?.apply?.(this, args);

      span.addEvent(`Ended ${methodName}`);

      span.setAttribute('call_ended_at', Date.now());
      span.end();

      // Por fim, não temos como inferir o tipo do retorno em tempo de compilação
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return result;
    };

    Object.defineProperty(target.prototype, propertyName, descriptor);
  }
}
