"""Prepara duas variantes do modelo Kokoro para controlar a melodia (acento tonal) da voz.

Uso: python make_f0_models.py kokoro-q8.onnx
Cria, na mesma pasta:
  kokoro-probe.onnx  — igual ao original, mas também devolve a curva de altura (F0) e as durações
  kokoro-f0.onnx     — recebe a curva de altura pela entrada extra "f0_in" em vez de usar a prevista
"""
import os, sys
import onnx
from onnx import helper, TensorProto

F0 = '/encoder/Reshape_output_0'      # altura prevista, em Hz, 80 quadros por segundo
DUR = '/encoder/Clip_output_0'        # duração de cada símbolo (inclui os 2 de borda); quadros de F0 = soma * 2
NOISE = '/encoder/Reshape_1_output_0'
USER = '/decoder/decoder/Unsqueeze'   # único nó que lê a altura prevista


def main():
    src = sys.argv[1]
    here = os.path.dirname(os.path.abspath(src))
    m = onnx.load(src)
    names = {o for n in m.graph.node for o in n.output}
    assert {F0, DUR, NOISE} <= names, 'modelo diferente do esperado'
    users = [n for n in m.graph.node if F0 in n.input]
    assert [n.name for n in users] == [USER], [n.name for n in users]

    probe = onnx.load(src)
    for name in (F0, DUR, NOISE):
        probe.graph.output.append(helper.make_empty_tensor_value_info(name))
    onnx.save(probe, os.path.join(here, 'kokoro-probe.onnx'))

    for n in m.graph.node:
        if n.name == USER:
            for i, x in enumerate(n.input):
                if x == F0: n.input[i] = 'f0_in'
    m.graph.input.append(helper.make_tensor_value_info('f0_in', TensorProto.FLOAT, [1, None]))
    onnx.save(m, os.path.join(here, 'kokoro-f0.onnx'))
    print('feito: kokoro-probe.onnx, kokoro-f0.onnx')


if __name__ == '__main__':
    main()
